// Définition des constantes
const D = 0.1 // Coefficient de diffusion de la chaleur
const dt = 0.01 // Pas de temps
const dx = 0.1 // Pas d'espace

// Initialisation des variables
const nx = 100 // Nombre de points dans la direction x
const ny = 100 // Nombre de points dans la direction y
let T = new Array(nx).fill(0).map(() => new Array(ny).fill(0)) // Température initiale

// Boucle de temps
for (let t = 0; t < 1000; t++) {
    // Copie de la température courante dans une nouvelle variable
    const Tn = T.map((row) => [...row])

    // Boucle sur chaque point de la grille
    for (let i = 1; i < nx - 1; i++) {
        for (let j = 1; j < ny - 1; j++) {
            // Calcul des dérivées partielles
            const d2Tdx2 = (T[i + 1][j] - 2 * T[i][j] + T[i - 1][j]) / dx ** 2
            const d2Tdy2 = (T[i][j + 1] - 2 * T[i][j] + T[i][j - 1]) / dx ** 2

            // Équation de diffusion de la chaleur
            Tn[i][j] = T[i][j] + D * dt * (d2Tdx2 + d2Tdy2)
        }
    }

    // Copie de la nouvelle température dans la variable courante
    T = Tn
}

console.log(T)
