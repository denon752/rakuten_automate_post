
import { generateProductDescription } from "./src/generateProductDescription";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Testing generateProductDescription with updated model...");
        const result = await generateProductDescription("Test Catchcopy", "Test Item", "Test Caption");
        console.log("Success! Generated text:", result);
    } catch (error: any) {
        console.error("Error details:", error.response ? error.response.data : error);
    }
}

main();
