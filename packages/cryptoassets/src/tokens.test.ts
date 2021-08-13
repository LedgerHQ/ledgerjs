import groupBy from "lodash/groupBy";
import { listTokens } from "./tokens";

test("There should be no contractAddress duplicates", () => {
  const groups = groupBy(listTokens({ withDelisted: true }), "contractAddress");
  expect(
    Object.keys(groups)
      .filter((k) => groups[k].length > 1)
      .map((key) => [key, groups[key].map((c) => c.id)])
  ).toEqual([]);
});
