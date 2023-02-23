# bolt-demandware-managed

# Bolt OCAPI Driven Managed Checkout Cartridges for SFRA

## Getting Started

1. Clone this repository.
2. From the top-level `/bolt-demandware-managed`, run `npm install` to install all package dependencies.
3. From the top-level `/bolt-demandware-managed`, edit the `paths.base` in package.json. This property should be the relative path to the local directory of the Storefront Reference Architecture repository. For example:

```
"paths": {
    "base": "../storefront-reference-architecture/cartridges/app_storefront_base/"
  }
```

4. Create `dw.json` file in the root of the project:

```json
{
  "hostname": "your-sandbox-hostname.demandware.net",
  "username": "yourlogin",
  "password": "yourpwd",
  "code-version": "version_to_upload_to"
}
```

5. From the top-level `/bolt-demandware-managed` folder, run `npm run compile:js && npm run compile:scss`
6. From the top-level `/bolt-demandware-managed` folder, run `npm run uploadCartridge`

Note: if you upload the bolt cartridge with a new `code-version`, you need to re-run step 5 and 6.

# NPM scripts

Use the provided NPM scripts to compile and upload changes to your Sandbox.

## Upload all cartridges to SFCC instance

`npm run upload:all`

## Linting your code

`npm run lint` - Execute linting for all JavaScript and SCSS files in the project. This should be run before committing code.

#Testing

## Running unit tests
`npm run test:unit` - Execute all the unit tests

## Locale support

supported locales: `en-US`, `en-CA`, `fr-CA`

For more information please check https://help.bolt.com/products/managed-checkout/sfcc-sfra-v2/