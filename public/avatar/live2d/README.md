# live2d/

Placeholder for Live2D Cubism Runtime export.

After rigging in Cubism Editor Free, drop here:

```
public/avatar/live2d/
├── model3.json        ← already stubbed (this file)
├── Lucy.moc3         ← compiled model
├── Lucy.2048/
│   ├── texture_00.png
│   └── texture_01.png
├── Lucy.physics3.json
└── Lucy.cdi3.json
```

Set `public/avatar/avatar.config.json → live2d.enabled = true` to enable.
See `docs/avatar.md §2.6` for the free PSD → Cubism pipeline.
