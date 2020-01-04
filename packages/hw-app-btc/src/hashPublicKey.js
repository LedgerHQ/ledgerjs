//@flow

import createHash from "create-hash";

export function hashPublicKey(buffer: Buffer) {
  return createHash("rmd160")
    .update(
      createHash("sha256")
        .update(buffer)
        .digest()
    )
    .digest();
}
