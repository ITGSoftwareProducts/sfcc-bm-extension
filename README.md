# Salesforce Commerce Cloud - Business Manager Extension Cartridge (SFCC BM Extension)

## Introduction

This cartridge introduces several new capabilities to the Salesforce Commerce Cloud (SFCC) Business Manager, providing users with new and robust functionality with a refreshed and modern user interface.
Users will now have access to highly productive, streamlined Business Manager capabilities to better support customers and business planning.

## Features

1. OCI Data Management Interface
2. CSV Import & Export
3. Automatic Notifications
4. Coupon Replicator
5. Customer Product Lists Displaying
6. Job Execution Report
7. Page Designer Export

## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in the user guide [documentation](documentation/BM_Extension_User_Guide.pdf).

## Compatibility

The cartridge is designed for Salesforce Commerce Cloud Business Manager with Compatibility Mode 18.10 or more.

## Compiling the Client-Side Files

1. Run `npm install` to install all of the local dependencies (This has been tested with v12.21.0 and is recommended).
2. Run `npm run compile:js` from the command line that would compile all client-side JS files.
3. Run `npm run compile:scss` that would do the same for CSS.

You can run `npm run build` to compile both JS and SCSS files.

## Testing
unit and integration tests can be found in the `ITGSoftwareProducts/sfcc-bm-extension/tests` directory. 
To run the integration tests locally use the following commands:
```
`npm run test:integration`
```

To run unit tests locally use the following command:
```
`npm run test`
```

## Contributing

Please check our [Contribution Guidelines](CONTRIBUTING.md) for details.

## License

BM Extension is licensed under the GNU GPLv3 License. See the [LICENSE](LICENSE) file for details.

---

If you encounter any issues or have questions, feel free to open an issue or reach out to us at salesforce@itgsoftware.com.
