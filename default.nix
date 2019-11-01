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

rec {

  # everything
  ledgerjs = yarn2nix.mkYarnPackage {
    name = "ledgerjs";
    src = pkgs.lib.cleanSource ./.;
    yarnNix = ./yarn.nix;
  };

  # sub-packages

  logs = yarn2nix.mkYarnPackage {
    name = "logs";
    src = pkgs.lib.cleanSource ./packages/logs;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
  };

  errors = yarn2nix.mkYarnPackage {
    name = "errors";
    src = pkgs.lib.cleanSource ./packages/errors;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
  };

  devices = yarn2nix.mkYarnPackage {
    name = "devices";
    src = pkgs.lib.cleanSource ./packages/devices;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    workspaceDependencies = [ errors logs ];
  };

  hw-transport = yarn2nix.mkYarnPackage {
    name = "hw-transport";
    src = pkgs.lib.cleanSource ./packages/hw-transport;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    workspaceDependencies = [ errors devices ];
  };

  hw-app-xtz = yarn2nix.mkYarnPackage {
    name = "hw-app-xtz";
    src = pkgs.lib.cleanSource ./packages/hw-app-xtz;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    workspaceDependencies = [ hw-transport ];
  };

}
