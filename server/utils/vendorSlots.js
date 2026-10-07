function vendorSlots(calls, acceptedGroups) {
  const counts = new Map(
    acceptedGroups.map((group) => [String(group._id), group.count]),
  );
  return calls.reduce(
    (totals, call) => {
      const occupied = counts.get(String(call._id)) || 0;
      return {
        total: totals.total + call.totalSlots,
        occupied: totals.occupied + occupied,
        available: totals.available + Math.max(0, call.totalSlots - occupied),
      };
    },
    { total: 0, occupied: 0, available: 0 },
  );
}
module.exports = { vendorSlots };
