export interface SpaceObjectData {
    id: string;
    name: string;
    type: "planet" | "satellite" | "star" | "other";
    radius: string;
    orbitalPeriod: string;
    description: string;
    distanceFromEarth?: string;
}

export const spaceObjects: SpaceObjectData[] = [
    {
        id: "earth",
        name: "Earth",
        type: "planet",
        radius: "6,371 km",
        orbitalPeriod: "365 days",
        description: "Earth is our home planet, the only known world with life.",
        distanceFromEarth: "0 km"
    },
    {
        id: "moon",
        name: "Moon",
        type: "satellite",
        radius: "1,737 km",
        orbitalPeriod: "27.3 days",
        description: "The Moon is Earth's only natural satellite and is tidally locked.",
        distanceFromEarth: "~384,400 km"
    }
];
