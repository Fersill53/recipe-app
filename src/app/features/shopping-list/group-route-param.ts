const UNGROUPED_PARAM = 'other';

// Angular's Router already encodes/decodes path segments, so these just
// map the sentinel value for "no recipe" to/from null.
export function groupRouteParam(groupName: string | null): string {
  return groupName === null ? UNGROUPED_PARAM : groupName;
}

export function groupNameFromRouteParam(param: string): string | null {
  return param === UNGROUPED_PARAM ? null : param;
}
