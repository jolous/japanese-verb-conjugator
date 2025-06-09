# Japanese Verb & Adjective Conjugator

This project provides a web interface for conjugating Japanese verbs and adjectives. Conjugation tables and example sentences are loaded from local JSON files rather than the OpenAI API. A list of common verbs and adjectives is included so you can quickly see their forms, or you can input your own words. Example sentences for each tense are stored as arrays in `public/verb_conjugations.json`; one example is chosen at random each time a verb is conjugated.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## Building for Production

To create an optimized build, run:
```bash
npm run build
```
The output will be placed in the `build` directory.

## License

This project is released under the [MIT License](LICENSE).
