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
        id: "sun",
        name: "Sun",
        type: "star",
        radius: "696,340 km",
        orbitalPeriod: "230-250 Million Years",
        description: "The Sun is the star at the center of our solar system. It's a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core.",
        distanceFromEarth: "~149.6 million km (1 AU)"
    },
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
