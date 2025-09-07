
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { GeneratedImage } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getMimeType = (base64: string): string => {
    return base64.substring(base64.indexOf(":") + 1, base64.indexOf(";"));
}

const getBase64Data = (base64: string): string => {
    return base64.split(',')[1];
}

const processResponse = (response: GenerateContentResponse): GeneratedImage => {
    if (response.candidates && response.candidates.length > 0) {
        // Check for safety blocks first
        if (response.candidates[0].finishReason !== 'STOP' && response.candidates[0].finishReason !== 'MAX_TOKENS') {
            const reason = response.candidates[0].finishReason || 'Unknown';
            const safetyRatings = response.candidates[0].safetyRatings?.map(r => r.category).join(', ') || 'none';
            throw new Error(`Image generation was blocked. Reason: ${reason}. Blocked categories: ${safetyRatings}. Please try with different images.`);
        }
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
    }
    
    throw new Error(`Image generation failed. No image data was returned by the model.`);
}

export const enhanceBackgroundPrompt = async (userPrompt: string): Promise<string> => {
    const instructions = `You are an expert prompt engineer for an advanced AI image generator. Your task is to take a user's simple background description and expand it into a rich, detailed, and photorealistic prompt.

**Instructions:**
1.  Read the user's input.
2.  Imagine a beautiful, high-resolution photograph representing that input.
3.  Describe that photograph in detail. Focus on:
    *   **Lighting:** (e.g., "dramatic morning light," "soft golden hour glow," "moody cinematic lighting," "glowing neon signs at night")
    *   **Atmosphere:** (e.g., "serene and tranquil," "bustling and energetic," "mystical and enchanting," "sleek and futuristic")
    *   **Specific Details:** (e.g., "cobblestone streets glistening with rain," "cherry blossom petals gently falling," "distant mountains shrouded in mist," "gleaming chrome and glass skyscrapers")
4.  Combine these elements into a cohesive, descriptive sentence or two.
5.  **Output ONLY the new prompt text.** Do not add any conversational text or explanations.

**Example:**
*   User Input: "a beach"
*   Your Output: "A serene tropical beach at sunset, with soft golden light casting long shadows from palm trees onto the pristine white sand, and calm turquoise waves gently lapping the shore."

**User Input:** "${userPrompt}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: instructions,
    });
    
    return response.text.trim();
};

export const generateTryOnImages = async (
  bodyPhotoBase64: string,
  itemPhotoBase64: string,
  backgroundPrompt: string
): Promise<GeneratedImage> => {
    const personPhotoPart = {
        inlineData: {
            mimeType: getMimeType(bodyPhotoBase64),
            data: getBase64Data(bodyPhotoBase64),
        },
    };

    const itemPhotoPart = {
        inlineData: {
            mimeType: getMimeType(itemPhotoBase64),
            data: getBase64Data(itemPhotoBase64),
        },
    };
    
    const instructions = `
<task>
  <goal>Virtual Clothing Try-On</goal>
  <description>Your task is to edit the 'person_photo' by seamlessly replacing the clothing worn by a designated person with the clothing item shown in the 'item_photo'. You must preserve the original person's pose, body shape, and face, while applying realistic fabric physics.</description>
  
  <inputs>
    <image id="person_photo">The base image containing one or more people and a background. The pose and face of the target person MUST be preserved.</image>
    <image id="item_photo">An image containing the piece of clothing to be applied.</image>
  </inputs>

  <physics_and_realism_guidelines>
    <guideline n="1">**Fabric Draping and Folds:** The clothing must drape naturally according to the person's pose and gravity. Generate realistic folds, creases, and wrinkles where the fabric would naturally bunch up (e.g., around joints, waist) or hang loosely. The draping should reflect the implied material of the clothing.</guideline>
    <guideline n="2">**Lighting and Shadows:** Accurately simulate how light from the original 'person_photo' environment interacts with the new clothing. Create soft shadows and highlights on the fabric that give it volume, depth, and texture. The shadows cast by the person onto the clothing, and by the clothing onto the person, must be consistent.</guideline>
    <guideline n="3">**Conformity to Body Shape:** The clothing should conform realistically to the contours of the person's body. It should not look like a flat sticker. It should wrap around the torso, arms, and legs, revealing the underlying body shape where appropriate.</guideline>
  </physics_and_realism_guidelines>

  <instructions>
    <step n="1">Analyze the 'person_photo'. If there are multiple people, identify the main subject. The main subject is typically the person most in focus, most centered, or most prominent in the foreground. If they are equally prominent, choose the person on the left.</step>
    <step n="2">Identify the clothing on the designated main subject.</step>
    <step n="3">Identify the clothing item in the 'item_photo'.</step>
    <step n="4">Replace the original clothing on the main subject in 'person_photo' with the clothing item from 'item_photo'.</step>
    <step n="5">Apply the new clothing by meticulously following all points in the <physics_and_realism_guidelines>. The fit must be perfect, matching the person's pose (including raised arms, sitting poses, etc.) and proportions.</step>
    <step n="6">CRITICAL: The person's face, hair, and identity MUST be preserved from the original 'person_photo'. However, you MUST realistically reconstruct any body parts (such as arms, hands, or torso) that were previously obscured by the original clothing. For example, if the new item has shorter sleeves than the original, you must generate the newly exposed skin on the arms and hands, ensuring they look natural and seamlessly connect to the body.</step>
    <step n="7">Do not alter any other people in the photo.</step>
    ${backgroundPrompt ? `<step n="8">CRITICAL: You MUST also replace the background of the 'person_photo' with the following: '${backgroundPrompt}'. The new background should be realistic and blend seamlessly with all subjects.</step>` : `<step n="8">CRITICAL: You MUST preserve the entire background of the original 'person_photo'.</step>`}
  </instructions>
  
  <critical_rule>
    The 'item_photo' is ONLY a reference for the clothing's appearance. DO NOT use its background. The final image must be a modified version of the original 'person_photo', altering only the clothing of the main subject and, if requested, the background. All other elements, including other people, MUST remain unchanged.
  </critical_rule>
  
  <output>
    Produce a single, high-quality, photorealistic image. The final image should be indistinguishable from a real photograph. It must show the main subject from 'person_photo' wearing the new clothing item with the specified background. Check your work to ensure hands, limbs, and all details are anatomically correct and flawlessly integrated. Pay special attention to the realistic draping of the fabric. Output ONLY the final image.
  </output>
</task>
    `;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { text: "You are a specialized AI for virtual clothing try-ons. Follow the XML instructions precisely." },
                { text: "This is the `person_photo`:" },
                personPhotoPart,
                { text: "This is the `item_photo`:" },
                itemPhotoPart,
                { text: instructions }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return processResponse(response);
};

export const enhanceImageQuality = async (
    base64Image: string
): Promise<GeneratedImage> => {
    const imagePart = {
        inlineData: {
            mimeType: getMimeType(base64Image),
            data: getBase64Data(base64Image),
        },
    };

    const instructions = `
You are a professional photo editing AI. Your task is to enhance the quality of the provided image to make it look like a high-resolution photograph from a DSLR camera.

**Goal:**
Upscale the image and increase its photorealism without altering its content.

**Instructions:**
1.  **Upscale & Sharpen:** Increase the resolution of the image. Subtly sharpen key features like fabric textures, facial details, and background elements to give it a crisp, high-definition look. Avoid over-sharpening that creates a 'digital' feel.
2.  **Photorealistic Lighting:** Analyze and enhance the existing lighting. Make highlights more luminous and shadows deeper to add depth and dimension, mimicking professional photography lighting.
3.  **Color Grading:** Perform professional color grading. Adjust color balance, saturation, and contrast to make the image more vibrant, rich, and visually appealing, as if it were shot for a fashion magazine.
4.  **Remove Artifacts:** Carefully identify and remove any subtle AI-generated imperfections, noise, or artifacts. The goal is a clean, flawless final image.
5.  **CRITICAL - Preserve Content:** You MUST NOT change the person's identity, pose, body shape, the clothing they are wearing, or the background scene. The final image must be a higher-quality, more photorealistic version of the original input.

**Output:**
Produce a single, high-quality, photorealistic image. Output ONLY the final image.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { text: instructions },
                imagePart
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return processResponse(response);
};


export const generateSingleColorVariation = async (
  baseItemPhotoBase64: string,
  colorPrompt: string
): Promise<GeneratedImage> => {
    const itemPhotoPart = {
        inlineData: {
            mimeType: getMimeType(baseItemPhotoBase64),
            data: getBase64Data(baseItemPhotoBase64),
        },
    };

    const instructions = `
You are an expert fashion designer AI. Your task is to re-color a clothing item.

**Input:**
1.  **Base Item Image:** An image of a piece of clothing.
2.  **Color:** A text description of the desired color.

**Instructions:**
1.  Generate a new image of the clothing item from the **Base Item Image**, but recolored to match the description: '${colorPrompt}'.
2.  **CRITICAL:** The generated item must be presented on a plain, solid white background.
3.  **CRITICAL:** Do not include any people, mannequins, or hangers. Output ONLY the clothing item itself.
4.  **CRITICAL:** Preserve the original shape, texture, and details of the clothing item perfectly. Only change the color.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { text: instructions },
                { text: "This is the `Base Item Image`:" },
                itemPhotoPart,
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return processResponse(response);
};

export const generateColorVariations = async (
  baseItemPhotoBase64: string
): Promise<GeneratedImage[]> => {
    const colors = ['a vibrant red', 'a deep royal blue', 'a forest green', 'a classic solid black', 'a sunny yellow'];

    const generationPromises = colors.map(color => 
      generateSingleColorVariation(baseItemPhotoBase64, color)
    );

    return Promise.all(generationPromises);
}
