# Walmart Inspector

### Price tracking
Walmart varies it's price per location. We cannot crawl every single page, for every single item, for every single store. That would be unreasonable and unmanagable.

The workaround, is to have every user with this extension individually report what the prices are that they see, and report it to a central database/api.

Together, collectively, with a pinch of patience, we can build a database of worldwide Walmart price history per store.

These prices are shown as a graph every time you click on an item

### Themes
Why doesn't Walmart have a built in dark mode? Ever have your eyeballs burnt out at 1am when trying to order some groceries, and you can't go to bed until you complete it because your partner will be upset that you didn't finish putting groceries into the cart before you went to bed? Yeah, this should help.

Also, why not, there's some other fun themes in there!

### Tax estimation
Ever look at the cart and think: "Why the f*** is it $50 more than what I expected?" yeah me too, so this adds a tax estimator in the top right.

### Future roadmap:
- Price comparison across stores (Save $X by switching to this store for pickup/delivery!)
- Price alerts

### Contributing
Please fork this repo and open pull requests with your code.

All pull requests MUST be fully linted, well typed, and be approved before being mergable.

This repository uses yarn, and PRs that suggest other package managers will be denied.
This repository uses typescript, and PRs that suggest Javascript or other languages will be denied.

Here's some package.json commands that may be helpful to contributers:
- `yarn` Install dependencies (node_modules)
- `yarn test` Run all unit tests on the code
- `yarn build` Build & bundle the code
- `yarn dev` Will watch for changes and rebuild when you edit the source code
- `yarn lint` Check to ensure your code is linted
- `yarn typecheck` Check to ensure your code is typed correctly with Typescript
- `yarn preflight` Will run all same build checks that the Github Actions script will, so you can check your local code before committing
