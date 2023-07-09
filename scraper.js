const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();

//For scraper.test.js to work please add in .env path to your chrome.exe
const CHROME_EXECUTABLE_PATH = process.env.CHROME_EXECUTABLE_PATH;
const actualYear = new Date().getFullYear();

const vodServices = [
  {
    name: "Netflix",
    url: `https://www.filmweb.pl/ranking/vod/netflix/film/${actualYear}`,
  },
  {
    name: "Max",
    url: `https://www.filmweb.pl/ranking/vod/hbo_max/film/${actualYear}`,
  },
  {
    name: "Canal+",
    url: `https://www.filmweb.pl/ranking/vod/canal_plus/film/${actualYear}`,
  },
  {
    name: "Disney+",
    url: `https://www.filmweb.pl/ranking/vod/disney/film/${actualYear}`,
  },
];

async function scrapeMovies() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const movies = [];

  try {
    for (const vodService of vodServices) {
      await page.goto(vodService.url, { waitUntil: "networkidle2" });

      await page.waitForSelector(".rankingType.hasVod .rankingType__card", {
        timeout: 10000,
      });

      const vodMovies = await page.evaluate((vodService) => {
        const movieElements = document.querySelectorAll(
          ".rankingType.hasVod .rankingType__card"
        );

        return Array.from(movieElements)
          .slice(0, 10) // Limiting to top 10 movies
          .map((element) => {
            const title = element
              .querySelector(".rankingType__title a")
              .innerText.trim();
            const ratingElement = element.querySelector(
              ".rankingType__rate--value"
            );
            const rating = parseFloat(
              ratingElement ? ratingElement.innerText.replace(",", ".") : 0
            );

            return { title, rating, vodServiceName: vodService.name };
          });
      }, vodService);

      movies.push(...vodMovies);
    }

    const uniqueMovies = Array.from(
      new Map(movies.map((movie) => [movie.title, movie])).values()
    );
    uniqueMovies.sort((a, b) => b.rating - a.rating);

    return uniqueMovies;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const movies = await scrapeMovies();
    saveToCSV(movies);
    console.log("CSV file saved successfully!");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

function saveToCSV(movies) {
  const csvHeader = "Title, VOD Service Name, Rating\n";
  const csvRows = movies.map((movie) => {
    const title = movie.title.replaceAll(",", "‚"); //Replacing "," in title with special sign for import issues.
    return `${title},${" " + movie.vodServiceName},${" " + movie.rating}`;
  });
  const csvData = csvHeader + csvRows.join("\n");

  fs.writeFileSync("movies.csv", csvData, "utf-8");
}

main();
module.exports = { scrapeMovies, saveToCSV, CHROME_EXECUTABLE_PATH };
