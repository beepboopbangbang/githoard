// From https://github.com/desktop/desktop/blob/development/app/src/lib/status-parser.ts

import * as Deque from 'double-ended-queue';
/**
* The status entry code as reported by Git.
*/
export var GitStatusEntry;
(function (GitStatusEntry) {
  GitStatusEntry["Modified"] = "M";
  GitStatusEntry["Added"] = "A";
  GitStatusEntry["Deleted"] = "D";
  GitStatusEntry["Renamed"] = "R";
  GitStatusEntry["Copied"] = "C";
  GitStatusEntry["Unchanged"] = ".";
  GitStatusEntry["Untracked"] = "?";
  GitStatusEntry["Ignored"] = "!";
  GitStatusEntry["UpdatedButUnmerged"] = "U";
})(GitStatusEntry || (GitStatusEntry = {}));
/** The enum representation of a Git file change in GitHub Desktop. */
export var AppFileStatusKind;
(function (AppFileStatusKind) {
  AppFileStatusKind["New"] = "New";
  AppFileStatusKind["Modified"] = "Modified";
  AppFileStatusKind["Deleted"] = "Deleted";
  AppFileStatusKind["Copied"] = "Copied";
  AppFileStatusKind["Renamed"] = "Renamed";
  AppFileStatusKind["Conflicted"] = "Conflicted";
  AppFileStatusKind["Untracked"] = "Untracked";
})(AppFileStatusKind || (AppFileStatusKind = {}));
/** Custom typeguard to differentiate Conflict files from other types */
export function isConflictedFileStatus(appFileStatus) {
  return appFileStatus.kind === AppFileStatusKind.Conflicted;
}
/** Custom typeguard to differentiate ConflictsWithMarkers from other Conflict types */
export function isConflictWithMarkers(conflictedFileStatus) {
  return conflictedFileStatus.hasOwnProperty('conflictMarkerCount'); // eslint-disable-line
}
/** Custom typeguard to differentiate ManualConflict from other Conflict types */
export function isManualConflict(conflictedFileStatus) {
  return !conflictedFileStatus.hasOwnProperty('conflictMarkerCount'); // eslint-disable-line
}
export var UnmergedEntrySummary;
(function (UnmergedEntrySummary) {
  UnmergedEntrySummary["AddedByUs"] = "added-by-us";
  UnmergedEntrySummary["DeletedByUs"] = "deleted-by-us";
  UnmergedEntrySummary["AddedByThem"] = "added-by-them";
  UnmergedEntrySummary["DeletedByThem"] = "deleted-by-them";
  UnmergedEntrySummary["BothDeleted"] = "both-deleted";
  UnmergedEntrySummary["BothAdded"] = "both-added";
  UnmergedEntrySummary["BothModified"] = "both-modified";
})(UnmergedEntrySummary || (UnmergedEntrySummary = {}));
/** encapsulate changes to a file associated with a commit */
export class FileChange {
  /**
  * @param path The relative path to the file in the repository.
  * @param status The status of the change to the file.
  */
  constructor(path, status) {
    this.path = path;
    this.status = status;
    if (status.kind === AppFileStatusKind.Renamed ||
      status.kind === AppFileStatusKind.Copied) {
      this.id = `${status.kind}+${path}+${status.oldPath}`;
    } else {
      this.id = `${status.kind}+${path}`;
    }
  }
}
/**
* An object encapsulating the changes to a committed file.
*
* @param status A commit SHA or some other identifier that ultimately
*               dereferences to a commit. This is the pointer to the
*               'after' version of this change. I.e. the parent of this
*               commit will contain the 'before' (or nothing, if the
*               file change represents a new file).
*/
export class CommittedFileChange extends FileChange {
  constructor(path, status, commitish) {
    super(path, status);
    this.commitish = commitish;
    this.commitish = commitish;
  }
}
export function isStatusHeader(statusItem) {
  return statusItem.kind === 'header';
}
export function isStatusEntry(statusItem) {
  return statusItem.kind === 'entry';
}
const ChangedEntryType = '1';
const RenamedOrCopiedEntryType = '2';
const UnmergedEntryType = 'u';
const UntrackedEntryType = '?';
const IgnoredEntryType = '!';
/** Parses output from git status --porcelain -z into file status entries */
export function parsePorcelainStatus(output) {
  const entries = new Array();
  // See https://git-scm.com/docs/git-status
  //
  // In the short-format, the status of each path is shown as
  // XY PATH1 -> PATH2
  //
  // There is also an alternate -z format recommended for machine parsing. In that
  // format, the status field is the same, but some other things change. First,
  // the -> is omitted from rename entries and the field order is reversed (e.g
  // from -> to becomes to from). Second, a NUL (ASCII 0) follows each filename,
  // replacing space as a field separator and the terminating newline (but a space
  // still separates the status field from the first filename). Third, filenames
  // containing special characters are not specially formatted; no quoting or
  // backslash-escaping is performed.
  const tokens = output.split('\0');
  const queue = new Deque(tokens);
  let field;
  while ((field = queue.shift())) {
    if (field.startsWith('# ') && field.length > 2) {
      entries.push({ kind: 'header', value: field.substr(2) });
      continue;
    }
    const entryKind = field.substr(0, 1);
    if (entryKind === ChangedEntryType) {
      entries.push(parseChangedEntry(field));
    }
    else if (entryKind === RenamedOrCopiedEntryType) {
      entries.push(parsedRenamedOrCopiedEntry(field, queue.shift()));
    }
    else if (entryKind === UnmergedEntryType) {
      entries.push(parseUnmergedEntry(field));
    }
    else if (entryKind === UntrackedEntryType) {
      entries.push(parseUntrackedEntry(field));
    }
    else if (entryKind === IgnoredEntryType) {
      // Ignored, we don't care about these for now
    }
  }
  return entries;
}
// 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
const changedEntryRe = /^1 ([MADRCUTX?!.]{2}) (N\.\.\.|S[C.][M.][U.]) (\d+) (\d+) (\d+) ([a-f0-9]+) ([a-f0-9]+) ([\s\S]*?)$/;
function parseChangedEntry(field) {
  const match = changedEntryRe.exec(field);
  if (!match) {
    // log.debug(`parseChangedEntry parse error: ${field}`);
    throw new Error(`Failed to parse status line for changed entry`);
  }
  return {
    kind: 'entry',
    statusCode: match[1],
    path: match[8],
  };
}
// 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path><sep><origPath>
const renamedOrCopiedEntryRe = /^2 ([MADRCUTX?!.]{2}) (N\.\.\.|S[C.][M.][U.]) (\d+) (\d+) (\d+) ([a-f0-9]+) ([a-f0-9]+) ([RC]\d+) ([\s\S]*?)$/;
function parsedRenamedOrCopiedEntry(field, oldPath) {
  const match = renamedOrCopiedEntryRe.exec(field);
  if (!match) {
    // log.debug(`parsedRenamedOrCopiedEntry parse error: ${field}`);
    throw new Error(`Failed to parse status line for renamed or copied entry`);
  }
  if (!oldPath) {
    throw new Error('Failed to parse renamed or copied entry, could not parse old path');
  }
  return {
    kind: 'entry',
    statusCode: match[1],
    oldPath,
    path: match[9],
  };
}
// u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
const unmergedEntryRe = /^u ([DAU]{2}) (N\.\.\.|S[C.][M.][U.]) (\d+) (\d+) (\d+) (\d+) ([a-f0-9]+) ([a-f0-9]+) ([a-f0-9]+) ([\s\S]*?)$/;
function parseUnmergedEntry(field) {
  const match = unmergedEntryRe.exec(field);
  if (!match) {
    // log.debug(`parseUnmergedEntry parse error: ${field}`);
    throw new Error(`Failed to parse status line for unmerged entry`);
  }
  return {
    kind: 'entry',
    statusCode: match[1],
    path: match[10],
  };
}
function parseUntrackedEntry(field) {
  const path = field.substr(2);
  return {
    kind: 'entry',
    // NOTE: We return ?? instead of ? here to play nice with mapStatus,
    // might want to consider changing this (and mapStatus) in the future.
    statusCode: '??',
    path,
  };
}
/**
* Map the raw status text from Git to a structure we can work with in the app.
*/
export function mapStatus(status) {
  if (status === '??') {
    return {
      kind: 'untracked',
    };
  }
  if (status === '.M') {
    return {
      kind: 'ordinary',
      type: 'modified',
      index: GitStatusEntry.Unchanged,
      workingTree: GitStatusEntry.Modified,
    };
  }
  if (status === 'M.') {
    return {
      kind: 'ordinary',
      type: 'modified',
      index: GitStatusEntry.Modified,
      workingTree: GitStatusEntry.Unchanged,
    };
  }
  if (status === '.A') {
    return {
      kind: 'ordinary',
      type: 'added',
      index: GitStatusEntry.Unchanged,
      workingTree: GitStatusEntry.Added,
    };
  }
  if (status === 'A.') {
    return {
      kind: 'ordinary',
      type: 'added',
      index: GitStatusEntry.Added,
      workingTree: GitStatusEntry.Unchanged,
    };
  }
  if (status === '.D') {
    return {
      kind: 'ordinary',
      type: 'deleted',
      index: GitStatusEntry.Unchanged,
      workingTree: GitStatusEntry.Deleted,
    };
  }
  if (status === 'D.') {
    return {
      kind: 'ordinary',
      type: 'deleted',
      index: GitStatusEntry.Deleted,
      workingTree: GitStatusEntry.Unchanged,
    };
  }
  if (status === 'R.') {
    return {
      kind: 'renamed',
      index: GitStatusEntry.Renamed,
      workingTree: GitStatusEntry.Unchanged,
    };
  }
  if (status === '.R') {
    return {
      kind: 'renamed',
      index: GitStatusEntry.Unchanged,
      workingTree: GitStatusEntry.Renamed,
    };
  }
  if (status === 'C.') {
    return {
      kind: 'copied',
      index: GitStatusEntry.Copied,
      workingTree: GitStatusEntry.Unchanged,
    };
  }
  if (status === '.C') {
    return {
      kind: 'copied',
      index: GitStatusEntry.Unchanged,
      workingTree: GitStatusEntry.Copied,
    };
  }
  if (status === 'AD') {
    return {
      kind: 'ordinary',
      type: 'added',
      index: GitStatusEntry.Added,
      workingTree: GitStatusEntry.Deleted,
    };
  }
  if (status === 'AM') {
    return {
      kind: 'ordinary',
      type: 'added',
      index: GitStatusEntry.Added,
      workingTree: GitStatusEntry.Modified,
    };
  }
  if (status === 'RM') {
    return {
      kind: 'renamed',
      index: GitStatusEntry.Renamed,
      workingTree: GitStatusEntry.Modified,
    };
  }
  if (status === 'RD') {
    return {
      kind: 'renamed',
      index: GitStatusEntry.Renamed,
      workingTree: GitStatusEntry.Deleted,
    };
  }
  if (status === 'DD') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.BothDeleted,
      us: GitStatusEntry.Deleted,
      them: GitStatusEntry.Deleted,
    };
  }
  if (status === 'AU') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.AddedByUs,
      us: GitStatusEntry.Added,
      them: GitStatusEntry.UpdatedButUnmerged,
    };
  }
  if (status === 'UD') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.DeletedByThem,
      us: GitStatusEntry.UpdatedButUnmerged,
      them: GitStatusEntry.Deleted,
    };
  }
  if (status === 'UA') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.AddedByThem,
      us: GitStatusEntry.UpdatedButUnmerged,
      them: GitStatusEntry.Added,
    };
  }
  if (status === 'DU') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.DeletedByUs,
      us: GitStatusEntry.Deleted,
      them: GitStatusEntry.UpdatedButUnmerged,
    };
  }
  if (status === 'AA') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.BothAdded,
      us: GitStatusEntry.Added,
      them: GitStatusEntry.Added,
    };
  }
  if (status === 'UU') {
    return {
      kind: 'conflicted',
      action: UnmergedEntrySummary.BothModified,
      us: GitStatusEntry.UpdatedButUnmerged,
      them: GitStatusEntry.UpdatedButUnmerged,
    };
  }
  // as a fallback, we assume the file is modified in some way
  return {
    kind: 'ordinary',
    type: 'modified',
  };
}
