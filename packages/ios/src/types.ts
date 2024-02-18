/**
 * Interface representing an iOS application.
 * 
 * @property {string} id - The unique identifier of the application.
 * @property {string} title - The title of the application.
 * @property {string} description - A description of the application.
 */
export interface iOSApp {
    id: string;
    title: string;
    description?: string;
}