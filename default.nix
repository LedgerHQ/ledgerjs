{ pkgs ? import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs-channels/tarball/f8a8fc6c7c079de430fa528f688ddac781bcef16";
    sha256 = "1ksmm7ymilzk2k6vfgv91ak0wvgpic0xsy5qdlrvljkdmbvfwn0n";
  }) {}
, reflex-platform ? import (builtins.fetchTarball {
    url = "https://github.com/reflex-frp/reflex-platform/archive/9e306f72ed0dbcdccce30a4ba0eb37aa03cf91e3.tar.gz";
    sha256 = "1crlwfw6zsx2izwsd57i5651p5pfyrpkfjwp6fc1yd4q4d4n7g2m";
  }) {}
, yarn2nix ? import (reflex-platform.hackGet ./deps/yarn2nix) { inherit pkgs; }
}:

yarn2nix.mkYarnPackage {
  name = "ledgerjs";
  src = ./.;
  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;
}
