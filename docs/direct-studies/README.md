# Études du pinceau sonore V9

Images des vrais appels du moteur GPU, avec les chants intégrés. La planche
montre quatre trajets proches avec quatre oiseaux (graines 106101, 106103, 106104,
106107). Elle est recadrée et réduite sans retoucher la matière. Les JPG
individuels gardent la feuille portrait complète ; `detail-4k.jpg` est un
recadrage 1:1 du PNG 2304 × 4096 du geai.

Reproduire : `scripts/render-offscreen.ts` en mode `direct-jets`, avec les PCM
16 kHz décodés des MP3 embarqués, puis `scripts/replay-egl.py`. Le mode `direct`
couvre les sept brosses. `direct-validation-egl.json` conserve les métriques et
les empreintes SHA-256. Aucun appel à une IA d’image.
