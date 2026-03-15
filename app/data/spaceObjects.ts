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
        id: "uranus",
        name: "Uranus",
        type: "planet",
        radius: "25,362 km",
        orbitalPeriod: "~84 years",
        description: "Uranus is an ice giant with a unique sideways rotation. Its blue-green color comes from methane in its atmosphere.",
        distanceFromEarth: "~2.6 billion km at closest"
    },
    {
        id: "neptune",
        name: "Neptune",
        type: "planet",
        radius: "24,622 km",
        orbitalPeriod: "~165 years",
        description: "Neptune is the outermost ice giant, known for its vivid blue color and the strongest winds in the solar system.",
        distanceFromEarth: "~4.3 billion km at closest"
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
        id: "phobos",
        name: "Phobos",
        type: "satellite",
        radius: "~11 km",
        orbitalPeriod: "7.6 hours",
        description: "Phobos is the innermost and larger of Mars's two moons. It is an irregular, heavily cratered body believed to be composed of carbon-rich rock. Phobos orbits very close to Mars and completes one orbit in about 7.6 hours. Due to its low orbit, Phobos is destined to crash into or be destroyed by Mars in 30–50 million years.",
        distanceFromEarth: "~225 million km (varies)"
    },
    {
        id: "deimos",
        name: "Deimos",
        type: "satellite",
        radius: "~6 km",
        orbitalPeriod: "30.3 hours",
        description: "Deimos is the outer and smaller of Mars's two moons. It is smoother and less cratered than Phobos and orbits Mars at a greater distance, completing one orbit in about 30.3 hours.",
        distanceFromEarth: "~225 million km (varies)"
    },
    {
        id: "io",
        name: "Io",
        type: "satellite",
        radius: "~1,821 km",
        orbitalPeriod: "1.769 days",
        description: "Io is the innermost of Jupiter's four Galilean moons and the most volcanically active body in the solar system. Its surface is covered in sulfur plains and volcanic deposits, giving it a vibrant yellow and orange appearance.",
        distanceFromEarth: "~628 million km (varies)"
    },
    {
        id: "europa",
        name: "Europa",
        type: "satellite",
        radius: "~1,560 km",
        orbitalPeriod: "3.551 days",
        description: "Europa is Jupiter's second Galilean moon and is covered by a smooth shell of water ice. Beneath its icy crust lies a global subsurface ocean, making Europa one of the most promising places in the solar system to search for extraterrestrial life.",
        distanceFromEarth: "~628 million km (varies)"
    },
    {
        id: "ganymede",
        name: "Ganymede",
        type: "satellite",
        radius: "~2,634 km",
        orbitalPeriod: "7.15 days",
        description: "Ganymede is the largest moon in the solar system and the only moon known to have its own magnetic field. Its surface consists of dark ancient terrain and lighter grooved regions composed of ice and rock.",
        distanceFromEarth: "~628 million km (varies)"
    },
    {
        id: "callisto",
        name: "Callisto",
        type: "satellite",
        radius: "~2,410 km",
        orbitalPeriod: "16.69 days",
        description: "Callisto is Jupiter's second-largest moon and the outermost of the four Galilean moons. It is the most heavily cratered object in the solar system and is composed of roughly equal parts rock and ice.",
        distanceFromEarth: "~628 million km (varies)"
    },
    {
        id: "mimas",
        name: "Mimas",
        type: "satellite",
        radius: "~198 km",
        orbitalPeriod: "0.94 days",
        description: "Mimas is Saturn's smallest and innermost major moon, famous for its large Herschel crater that gives it a 'Death Star' appearance. It is composed primarily of water ice with a rocky core.",
        distanceFromEarth: "~1.2 billion km (varies)"
    },
    {
        id: "enceladus",
        name: "Enceladus",
        type: "satellite",
        radius: "~252 km",
        orbitalPeriod: "1.37 days",
        description: "Enceladus is a bright icy moon of Saturn known for its cryovolcanoes that eject water vapor and ice particles from its south polar region.",
        distanceFromEarth: "~1.2 billion km (varies)"
    },
    {
        id: "tethys",
        name: "Tethys",
        type: "satellite",
        radius: "~531 km",
        orbitalPeriod: "1.89 days",
        description: "Tethys is an icy moon of Saturn known for its enormous Ithaca Chasma canyon that stretches across much of its surface.",
        distanceFromEarth: "~1.2 billion km (varies)"
    },
    {
        id: "dione",
        name: "Dione",
        type: "satellite",
        radius: "~561 km",
        orbitalPeriod: "2.736 days",
        description: "Dione is an icy moon of Saturn known for its bright fracture lines and heavily cratered terrain.",
        distanceFromEarth: "~1.2 billion km (varies)"
    },
    {
        id: "rhea",
        name: "Rhea",
        type: "satellite",
        radius: "~764 km",
        orbitalPeriod: "4.518 days",
        description: "Rhea is Saturn's second-largest moon, heavily cratered and composed primarily of water ice.",
        distanceFromEarth: "~1.2 billion km (varies)"
    },
    {
        id: "titan",
        name: "Titan",
        type: "satellite",
        radius: "~2,575 km",
        orbitalPeriod: "15.95 days",
        description: "Titan is Saturn's largest moon and the second-largest moon in the Solar System. It has a dense nitrogen atmosphere and lakes of liquid methane and ethane on its surface.",
        distanceFromEarth: "~1.4 billion km (varies)"
    },
    {
        id: "miranda",
        name: "Miranda",
        type: "satellite",
        radius: "~235 km",
        orbitalPeriod: "1.413 days",
        description: "Miranda is the smallest and innermost of Uranus's five major moons. It has a bizarre, patchwork surface with cliffs, canyons, and varied terrain, suggesting it may have been shattered and reassembled.",
        distanceFromEarth: "~2.6 billion km (varies)"
    },
    {
        id: "ariel",
        name: "Ariel",
        type: "satellite",
        radius: "~578 km",
        orbitalPeriod: "2.52 days",
        description: "Ariel is one of Uranus's five major moons and is known for its bright icy surface and deep valleys formed by tectonic activity.",
        distanceFromEarth: "~2.6 billion km (varies)"
    },
    {
        id: "umbriel",
        name: "Umbriel",
        type: "satellite",
        radius: "~584 km",
        orbitalPeriod: "4.144 days",
        description: "Umbriel is one of Uranus's five major moons and has the darkest surface among them, heavily cratered with ancient terrain.",
        distanceFromEarth: "~2.6 billion km (varies)"
    },
    {
        id: "titania",
        name: "Titania",
        type: "satellite",
        radius: "~788 km",
        orbitalPeriod: "8.706 days",
        description: "Titania is the largest moon of Uranus and features large fault valleys and icy plains formed by tectonic activity.",
        distanceFromEarth: "~2.6 billion km (varies)"
    },
    {
        id: "oberon",
        name: "Oberon",
        type: "satellite",
        radius: "~761 km",
        orbitalPeriod: "13.463 days",
        description: "Oberon is the outermost major moon of Uranus and is heavily cratered with dark ancient terrain.",
        distanceFromEarth: "~2.6 billion km (varies)"
    },
    {
        id: "triton",
        name: "Triton",
        type: "satellite",
        radius: "~1353 km",
        orbitalPeriod: "5.876 days",
        description: "Triton is the largest moon of Neptune and the only large moon in the solar system with a retrograde orbit. It likely formed as a captured Kuiper Belt object and has cryovolcanoes on its surface.",
        distanceFromEarth: "~4.3 billion km (varies)"
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
