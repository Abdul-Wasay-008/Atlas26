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
        id: "mercury",
        name: "Mercury",
        type: "planet",
        radius: "2,440 km",
        orbitalPeriod: "88 days",
        description: "Mercury is the smallest planet in our solar system and the closest to the Sun. It has a heavily cratered surface and extreme temperature variations.",
        distanceFromEarth: "~77 million km at closest"
    },
    {
        id: "venus",
        name: "Venus",
        type: "planet",
        radius: "6,052 km",
        orbitalPeriod: "225 days",
        description: "Venus is the second planet from the Sun, an Earth-sized terrestrial world with a thick, cloudy atmosphere and extreme surface conditions.",
        distanceFromEarth: "~38 million km at closest"
    },
    {
        id: "mars",
        name: "Mars",
        type: "planet",
        radius: "3,389 km",
        orbitalPeriod: "687 days",
        description: "Mars is the fourth planet from the Sun, a terrestrial world with polar ice caps, seasons, and a history of water.",
        distanceFromEarth: "~78 million km at closest"
    },
    {
        id: "jupiter",
        name: "Jupiter",
        type: "planet",
        radius: "69,911 km",
        orbitalPeriod: "~12 years",
        description: "Jupiter is the largest planet in our solar system, a gas giant with a Great Red Spot storm and dozens of moons.",
        distanceFromEarth: "~588 million km at closest"
    },
    {
        id: "saturn",
        name: "Saturn",
        type: "planet",
        radius: "58,232 km",
        orbitalPeriod: "~29 years",
        description: "Saturn is the sixth planet from the Sun, famous for its stunning ring system made of ice and rock particles.",
        distanceFromEarth: "~1.2 billion km at closest"
    },
    {
        id: "moon",
        name: "Moon",
        type: "satellite",
        radius: "1,737 km",
        orbitalPeriod: "27.3 days",
        description: "The Moon is Earth's only natural satellite and is tidally locked.",
        distanceFromEarth: "~384,400 km"
    },
    {
        id: "iss",
        name: "ISS",
        type: "satellite",
        radius: "~109 m",
        orbitalPeriod: "~93 minutes",
        description: "The International Space Station (ISS) is a modular space station in low Earth orbit. It serves as a microgravity and space environment research laboratory.",
        distanceFromEarth: "~400 km"
    },
    {
        id: "hubble",
        name: "Hubble Space Telescope",
        type: "satellite",
        radius: "~13.2 m",
        orbitalPeriod: "~96 minutes",
        description: "The Hubble Space Telescope is a space telescope that has been observing the universe from low Earth orbit since 1990. It has revolutionized astronomy with its high-resolution images.",
        distanceFromEarth: "~547 km"
    }
];
