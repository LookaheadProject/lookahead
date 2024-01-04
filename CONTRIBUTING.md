# Contribution guidelines

Welcome to Lookahead! Your contributions are highly valued and we deeply appreciate your support—it means a lot! Lookahead is the product of many minds and it wouldn't exist without collaboration. However, we have strict expectations on code quality which we will enforce rigorously.

Outside of coding standards, our expectations of behaviour are straightforward. To sum it up simply, use common sense and always treat others with respect. In this community, we will be upholding the latest version of the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

Below are a couple of general rules which we highly encourage you read and understand prior to making a commit or pull request:
* We mandate the use of an autoformatter: [Prettier](https://prettier.io/) for the front-end (HTML, S/CSS, JS, TS) and [Black](https://black.readthedocs.io/en/stable/) when working on the Python backend. _We strongly encourage you to enable format-on-save in your editor of choice._ An autoformatter ensures code style consistency, allowing for universal consensus on stylistic choices. Where required, `.prettierrc` and `pyproject.toml` files are provided and should be automatically detected by the autoformatter.
* Comment your work, but don't comment excessively. If code is self explanatory, a comment may not be necessary.
* Keep your approach modular.
* Use separate git branches when working on new features or bugfixes.
* Avoid merging or committing directly to the `main` or `develop` branches. If you are developing features, create your own separate branch first.
