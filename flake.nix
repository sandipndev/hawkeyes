{
  description = "Hawkeyes - Plan Builder + Live Ops platform";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem
    (system: let
      overlays = [
        (self: super: {
          nodejs = super.nodejs_22;
        })
      ];
      pkgs = import nixpkgs {
        inherit system overlays;
      };
      nativeBuildInputs = with pkgs; [
        git
        alejandra
        nodejs
        pnpm
        openssl
        nodePackages.typescript-language-server
        nodePackages.vercel
      ];

      devEnvVars = rec {
        URL = "";
      };
    in
      with pkgs; {
        devShells.default = mkShell (devEnvVars
          // {
            inherit nativeBuildInputs;
          });

        formatter = alejandra;
      });
}
