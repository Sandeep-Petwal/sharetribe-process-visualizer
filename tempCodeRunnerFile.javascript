const fetch = require("node-fetch"); // Run: npm install node-fetch

const BASE_URL = "https://thatwebsite.com/images/";
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MAX_ATTEMPTS = 1000; // Set to 3000 or more as needed
const ID_LENGTH = 7; // Like: fVCTDdd

function generateRandomId(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
}

async function checkImageUrl(id) {
  const url = `${BASE_URL}${id}.jpeg`;
  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type");

    // Check if it's an image type
    if (res.ok && contentType && contentType.startsWith("image")) {
      return url;
    }

    // Fallback: if content-type is missing or misleading, check if body is HTML
    const body = await res.text();
    if (!body.includes("<html>") && !body.includes("404 Not Found")) {
      return url;
    }
  } catch (err) {
    // Ignore fetch errors silently
  }

  return null;
}

async function main(range = MAX_ATTEMPTS) {
  const foundImages = [];

  for (let i = 1; i <= range; i++) {
    const randomId = generateRandomId(ID_LENGTH);
    const imageUrl = await checkImageUrl(randomId);

    if (imageUrl) {
      console.log(`[${i}/${range}] ✅ Found: ${imageUrl}`);
      foundImages.push(imageUrl);
    } else {
      console.log(`[${i}/${range}] ❌ Invalid ID`);
    }
  }

  console.log("\n🎉 Total Valid Images Found:", foundImages.length);
  console.log("✅ Valid Image URLs:");
  console.log(foundImages);
}

main(); // Run the script
