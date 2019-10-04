let 
nixpkgs-src = builtins.fetchTarball {
  url = "https://github.com/NixOS/nixpkgs-channels/tarball/f8a8fc6c7c079de430fa528f688ddac781bcef16";
  sha256 = "1ksmm7ymilzk2k6vfgv91ak0wvgpic0xsy5qdlrvljkdmbvfwn0n";
}; 
pkgs = import nixpkgs-src {};

reflex-platform = import (pkgs.fetchFromGitHub {
  owner = "reflex-frp";
  repo = "reflex-platform";
  rev = "9e306f72ed0dbcdccce30a4ba0eb37aa03cf91e3";
  sha256 = "1crlwfw6zsx2izwsd57i5651p5pfyrpkfjwp6fc1yd4q4d4n7g2m";
}) {};

hackGet = reflex-platform.hackGet;
yarn2nix = hackGet deps/yarn2nix;

in

with pkgs;
with (import yarn2nix { inherit pkgs; });
rec {
  ledgerjs = mkYarnPackage {
    name = "ledgerjs";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    # NOTE: this is optional and generated dynamically if omitted
    yarnNix = ./yarn.nix;
  };
}
