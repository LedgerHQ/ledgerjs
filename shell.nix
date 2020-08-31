{ pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = with pkgs; [ nodejs yarn nodePackages.node-gyp libusb pkg-config python ];
}
