import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ElementHandle, Page } from 'puppeteer';

export interface SafeClickOptions {
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Delay between retries in milliseconds (default: 500) */
    delay?: number;
    /** Wait for element to be visible before clicking (default: true) */
    waitForVisible?: boolean;
}

/**
 * Safely clicks an element with retry logic.
 * Avoids "Node is either not clickable or not an Element" errors by retrying.
 * 
 * @param page - Puppeteer Page instance
 * @param selector - CSS selector for the element to click
 * @param options - Configuration options for retries and delays
 * @returns True if click was successful
 * @throws Error if all retry attempts fail
 */
export async function safeClick(
    page: Page,
    selector: string,
    options: SafeClickOptions = {}
): Promise<boolean> {
    const { retries = 3, delay = 500, waitForVisible = true } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Wait for the element to be present in the DOM
            if (waitForVisible) {
                await page.waitForSelector(selector, { visible: true, timeout: 5000 });
            }

            const element = await page.$(selector);

            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }

            // Try to click the element
            await element.click();

            return true;
        } catch (error) {
            lastError = error as Error;

            if (attempt < retries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // If we've exhausted all retries, throw the last error
    throw new Error(
        `Failed to click element "${selector}" after ${retries} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}`
    );
}

/**
 * Safely clicks an element by ID with retry logic.
 * Searches for the element on each attempt, useful when the element may not exist yet.
 * 
 * @param page - Puppeteer Page instance
 * @param elementId - ID of the element to click (without the # prefix)
 * @param options - Configuration options for retries and delays
 * @returns True if click was successful
 * @throws Error if all retry attempts fail
 */
export async function safeClickElement(
    page: Page,
    elementId: string,
    options: Omit<SafeClickOptions, 'waitForVisible'> = {}
): Promise<boolean> {
    const { retries = 3, delay = 1500 } = options;
    const selector = elementId.startsWith('#') ? elementId : `#${elementId}`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Search for the element on each attempt
            const element = await page.$(selector);

            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }

            await element.click();
            return true;
        } catch (error) {
            lastError = error as Error;

            if (attempt < retries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(
        `Failed to click element "${selector}" after ${retries} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}`
    );
}

const execPromise = promisify(exec);

// Alternative approach using qpdf external tool
export async function decryptBase64PdfWithQpdf(base64Input: string, password: string): Promise<string> {
    try {
        const uuid = uuidv4();

        // Create temporary files
        const tempInputPath = path.join(__dirname, `temp_encrypted_${uuid}.pdf`);
        const tempOutputPath = path.join(__dirname, `temp_decrypted_${uuid}.pdf`);

        // Step 1: Decode the base64 input to a temporary PDF file
        const pdfBuffer = Buffer.from(base64Input, 'base64');
        fs.writeFileSync(tempInputPath, pdfBuffer);

        // Step 2: Use qpdf to decrypt the PDF
        const qpdfCommand = `qpdf --password=${password} --decrypt ${tempInputPath} ${tempOutputPath}`;
        await execPromise(qpdfCommand);

        // Step 3: Read the decrypted PDF and convert to base64
        const decryptedPdfBuffer = fs.readFileSync(tempOutputPath);
        const base64Output = decryptedPdfBuffer.toString('base64');

        // Clean up temporary files
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(tempOutputPath);

        return base64Output;
    } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
    }
}