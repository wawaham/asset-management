export function getAssetMonthContext(snapshots, month) {
  let selectedSnapshot = null;
  let previousSnapshot = null;

  for (const snapshot of snapshots) {
    if (snapshot.month === month) selectedSnapshot = snapshot;
    if (snapshot.month < month && (!previousSnapshot || snapshot.month > previousSnapshot.month)) {
      previousSnapshot = snapshot;
    }
  }

  return { selectedSnapshot, previousSnapshot };
}
