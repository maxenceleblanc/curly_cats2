# Branding — Curly CATS

## Présentation

Bruno a été rebrandé en **Curly CATS** pour un usage interne en entreprise. Ce document recense tous les fichiers modifiés, les emplacements des logos, et la procédure à suivre pour mettre à jour le branding à l'avenir.

---

## Logos

### Source des images

Tous les logos Curly CATS sont stockés dans :

```
C:\Users\Maxence\Desktop\images_curly_cats\
├── 16x16.png
├── 24x24.png
├── 32x32.png
├── 48x48.png
├── 64x64.png
├── 128x128.png
├── 256x256.png
└── logo_curly_cats.png
```

### Emplacements dans le projet

| Fichier | Taille utilisée | Usage |
|---|---|---|
| `packages/bruno-electron/resources/icons/png/16x16.png` | 16x16 | Icône système (Linux, barre des tâches) |
| `packages/bruno-electron/resources/icons/png/24x24.png` | 24x24 | Icône système |
| `packages/bruno-electron/resources/icons/png/32x32.png` | 32x32 | Icône système |
| `packages/bruno-electron/resources/icons/png/48x48.png` | 48x48 | Icône système |
| `packages/bruno-electron/resources/icons/png/64x64.png` | 64x64 | Icône système |
| `packages/bruno-electron/resources/icons/png/128x128.png` | 128x128 | Icône système |
| `packages/bruno-electron/resources/icons/png/256x256.png` | 256x256 | Icône système / macOS |
| `packages/bruno-electron/src/about/256x256.png` | 256x256 | Fenêtre "About Curly CATS" |
| `packages/bruno-app/public/favicon.ico` | 32x32 (PNG renommé) | Favicon onglet navigateur |
| `packages/bruno-app/src/assets/logo_curly_cats.png` | Original | Logo affiché dans la barre de titre (composant `Bruno`) |

> **Note :** Les fichiers `512x512.png`, `1024x1024.png` (icônes haute résolution), `resources/icons/mac/icon.icns` (macOS) et `resources/icons/win/icon.ico` (Windows) n'ont **pas** été remplacés car les formats `.icns` et `.ico` nécessitent une conversion depuis les PNG sources. Pour les générer :
> - `.icns` (macOS) : utiliser `iconutil` ou un outil en ligne
> - `.ico` (Windows) : utiliser un outil comme [IcoConvert](https://icoconvert.com/) avec les tailles 16, 32, 48, 64, 128, 256

### Mettre à jour un logo

Remplacer le fichier PNG correspondant puis relancer `npm run dev`. Aucune autre manipulation n'est nécessaire pour les PNG.

---

## Textes de marque

### Fichiers modifiés

#### `packages/bruno-electron/electron-builder-config.js`

Paramètres de l'installeur et du build de production :

| Champ | Avant | Après |
|---|---|---|
| `productName` | `Bruno` | `Curly CATS` |
| `mac.protocols[].name` | `Bruno` | `Curly CATS` |
| `linux.protocols[].name` | `Bruno` | `Curly CATS` |
| `win.publisherName` | `Bruno Software Inc` | `Curly CATS` |

#### `packages/bruno-electron/src/index.js`

| Champ | Avant | Après |
|---|---|---|
| `title` (BrowserWindow) | `Bruno` | `Curly CATS` |

#### `packages/bruno-electron/src/app/about-bruno.js`

Page "About" affichée via le menu de l'application :
- Titre HTML : `About Bruno` → `About Curly CATS`
- Logo SVG chien supprimé, remplacé par `<img>` pointant vers `src/about/256x256.png`
- Titre affiché : `Bruno ${version}` → `Curly CATS ${version}`
- Copyright : `Bruno Software Inc` → `Curly CATS`

#### `packages/bruno-electron/src/app/menu-template.js`

| Champ | Avant | Après |
|---|---|---|
| Label menu About | `About Bruno` | `About Curly CATS` |

#### `packages/bruno-app/src/components/AppTitleBar/AppMenu/index.js`

| Champ | Avant | Après |
|---|---|---|
| Label menu About | `About Bruno` | `About Curly CATS` |

#### `packages/bruno-app/src/components/AppTitleBar/index.js`

| Champ | Avant | Après |
|---|---|---|
| Texte affiché dans la barre de titre | `Bruno` | `Curly CATS` |

#### `packages/bruno-app/src/components/Bruno/index.js`

Composant React utilisé dans la barre de titre pour afficher le logo :
- SVG du chien Bruno supprimé
- Remplacé par `<img>` pointant vers `assets/logo_curly_cats.png`

#### `packages/bruno-app/src/utils/collections/export.js`

| Champ | Avant | Après |
|---|---|---|
| `exportedUsing` (métadonnée d'export) | `Bruno` / `Bruno/{version}` | `Curly CATS` / `Curly CATS/{version}` |

#### `packages/bruno-app/src/utils/exporters/opencollection.js`

| Champ | Avant | Après |
|---|---|---|
| `exportedUsing` (métadonnée OpenCollection) | `Bruno` / `Bruno/{version}` | `Curly CATS` / `Curly CATS/{version}` |

#### `packages/bruno-app/src/components/Sidebar/Collections/Collection/GenerateDocumentation/index.js`

| Champ | Avant | Après |
|---|---|---|
| `exportedUsing` (génération de documentation) | `Bruno` / `Bruno/{version}` | `Curly CATS` / `Curly CATS/{version}` |

---

## Ce qui n'a pas été modifié (intentionnel)

Les éléments suivants contiennent le mot "bruno" mais sont des **identifiants techniques** — les modifier casserait le fonctionnement de l'application :

| Élément | Raison de ne pas modifier |
|---|---|
| `appId: 'com.usebruno.app'` | Identifiant unique de l'app Electron, lié aux données persistantes |
| `schemes: ['bruno']` | Schéma de protocole URL (`bruno://`), modifiable mais non prioritaire |
| Noms des packages (`@usebruno/...`) | Identifiants npm internes |
| Noms de variables/fonctions (`aboutBruno`, `isBrunoEnv`...) | Code interne, pas visible par l'utilisateur |
| Chemins de fichiers (`packages/bruno-electron/...`) | Structure du dépôt |

---

## Procédure de mise à jour du branding

Pour changer le nom ou les logos à l'avenir :

1. **Logos PNG** : remplacer les fichiers dans `packages/bruno-electron/resources/icons/png/` et `packages/bruno-app/public/favicon.ico`
2. **Logo page About** : remplacer `packages/bruno-electron/src/about/256x256.png`
3. **Nom affiché** : chercher `Curly CATS` dans les fichiers listés ci-dessus et remplacer
4. **Relancer** : `npm run dev` pour voir les changements
