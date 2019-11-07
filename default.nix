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

let
  # dependencies of top-level
  deps = yarn2nix.mkYarnPackage {
    name = "ledgerjs-deps";
    src = builtins.filterSource (path: _: builtins.elem (builtins.baseNameOf path) ["package.json" "yarn.lock"]) ./.;
    yarnNix = ./yarn.nix;
  };

  mkLedgerJSPackage = { name, src, workspaceDependencies ? [], postInstall ? "" }:
    yarn2nix.mkYarnPackage {
      inherit name workspaceDependencies;
      src = pkgs.lib.cleanSource src;
      yarnLock = ./yarn.lock;
      yarnNix = ./yarn.nix;
      extraBuildInputs = [ pkgs.systemd pkgs.v8_5_x pkgs.nodejs pkgs.libusb1 ];
      NIX_CFLAGS_COMPILE = "-I${pkgs.nodejs}/include/node -I${pkgs.lib.getDev pkgs.libusb1}/include/libusb-1.0";
      buildPhase = ''
        PATH=${deps}/libexec/ledger-libs/node_modules/.bin:$PATH
        export NODE_PATH=${deps}/libexec/ledger-libs/node_modules
        pushd deps/$pname
        babel --presets env,flow,react,stage-0 --source-maps -d lib src
        flow-copy-source -v src lib
        popd

        PATH=${pkgs.python2}/bin:$PATH
        if [ -d node_modules/usb/ ]; then
          (cd node_modules/usb/ && node-gyp rebuild --nodedir=${pkgs.lib.getDev pkgs.nodejs}/include/node)
        fi

        if [ -d node_modules/node-hid/ ]; then
          (cd node_modules/node-hid/ && node-gyp rebuild --nodedir=${pkgs.lib.getDev pkgs.nodejs}/include/node)
        fi
      '';
      inherit postInstall;
    };
in rec {
  # sub-packages

  logs = mkLedgerJSPackage {
    name = "logs";
    src = ./packages/logs;
  };

  errors = mkLedgerJSPackage {
    name = "errors";
    src = ./packages/errors;
  };

  devices = mkLedgerJSPackage {
    name = "devices";
    src = ./packages/devices;
    workspaceDependencies = [ errors logs ];
  };

  hw-transport = mkLedgerJSPackage {
    name = "hw-transport";
    src = ./packages/hw-transport;
    workspaceDependencies = [ errors devices ];
  };

  hw-transport-node-hid-noevents = mkLedgerJSPackage {
    name = "hw-transport-node-hid-noevents";
    src = ./packages/hw-transport-node-hid-noevents;
    workspaceDependencies = [ errors devices hw-transport logs ];
  };

  hw-transport-node-hid = mkLedgerJSPackage {
    name = "hw-transport-node-hid";
    src = ./packages/hw-transport-node-hid;
    workspaceDependencies = [ errors devices hw-transport hw-transport-node-hid-noevents logs ];
  };

  hw-app-xtz = mkLedgerJSPackage {
    name = "hw-app-xtz";
    src = ./packages/hw-app-xtz;
    workspaceDependencies = [ hw-transport ];
  };

  hw-transport-u2f = mkLedgerJSPackage {
    name = "hw-transport-u2f";
    src = ./packages/hw-transport-u2f;
    workspaceDependencies = [ hw-transport errors logs ];
  };

  hw-transport-mocker = mkLedgerJSPackage {
    name = "hw-transport-mocker";
    src = ./packages/hw-transport-mocker;
    workspaceDependencies = [ hw-transport logs ];
  };

  # Some quick tests for hw-app-xtz
  # Run using the ${hw-app-xtz-test}/bin/run-tests binary

  hw-app-xtz-test = let
    runTests = pkgs.writeText "run-tests.sh" ''
      #!/usr/bin/env sh
      PATH=${pkgs.nodejs}/bin:${deps}/libexec/ledger-libs/node_modules/.bin:$PATH
      DIR=$(cd "$(dirname ''${BASH_SOURCE[0]})" >/dev/null 2>&1 && pwd)
      cd $DIR/../libexec/@ledgerhq/hw-app-xtz-test/deps/@ledgerhq/hw-app-xtz-test
      node lib/node-index.js
    '';
  in mkLedgerJSPackage {
    name = "hw-app-xtz-test";
    src = ./packages/hw-app-xtz-test;
    workspaceDependencies = [ hw-app-xtz hw-transport-node-hid hw-transport-mocker ];
    postInstall = ''
      install -m 755 ${runTests} $out/bin/run-tests
    '';
  };

  # Single file version of hw-app-xtz

  hw-app-xtz-packed = let
    index = pkgs.writeText "index.js" ''
      require("babel-polyfill");
      const Transport = require("@ledgerhq/hw-transport-u2f").default;
      const App = require("@ledgerhq/hw-app-xtz").default;
      module.exports = { app: App, transport: Transport };
    '';
    webpack-config = pkgs.writeText "webpack.config.js" ''
module.exports = {
  resolve: {
    modules: [
      "${hw-app-xtz}/libexec/@ledgerhq/hw-app-xtz/node_modules",
      "${hw-transport-u2f}/libexec/@ledgerhq/hw-transport-u2f/node_modules",
      "node_modules",

      // TODO: remove!
      "${hw-app-xtz-test}/libexec/@ledgerhq/hw-app-xtz-test/node_modules"
    ]
  }
};
    '';
  in pkgs.runCommand "hw-app-xtz.js" {
    buildInputs = [ pkgs.nodePackages.webpack-cli pkgs.nodePackages.webpack pkgs.nodejs ];
  } ''
    cp ${index} index.js
    cp ${webpack-config} webpack.config.js

    webpack-cli --output-library "ledger" --mode development index.js -o $out
  '';

}
