const puppeteer = require("puppeteer-core");
require("dotenv").config();

const {
  scrapeMovies,
  saveToCSV,
  CHROME_EXECUTABLE_PATH,
} = require("./scraper.js");

describe("Scrape Movies", () => {
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE_PATH,
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should scrape movies from VOD services", async () => {
    const movies = await scrapeMovies();

    expect(Array.isArray(movies)).toBe(true); // Verify that movies is an array
    expect(movies.length).toBeGreaterThan(0); // Verify that movies array is not empty
    expect(typeof movies[0].rating).toBe("number"); // Verify that the rating is a number
    expect(typeof movies[0].title).toBe("string"); // Verify that the title is a string
    expect(typeof movies[0].vodServiceName).toBe("string"); // Verify that the vodServiceName is a string
    expect(movies[0].title).toBeTruthy(); // Verify that the title is not empty
    expect(movies[0].vodServiceName).toBeTruthy(); // Verify that the vodServiceName is not empty

    saveToCSV(movies);
    console.log("CSV file saved successfully!");
  }, 10000);
});
