export const IPC = {
  UPLOAD: 'upload',
  TEST_UPLOAD: 'test-upload',
  READ_CLIPBOARD_IMAGE: 'read-clipboard-image',
  GET_CONFIG: 'get-config',
  SET_CONFIG: 'set-config',
  OPEN_FILE: 'open-file',
  SAVE_FILE: 'save-file',
  // Menu events sent from main → renderer
  MENU_OPEN_FILE: 'menu:open-file',
  MENU_SAVE_FILE: 'menu:save-file',
  MENU_FIND: 'menu:find',
  MENU_VIEW_MODE: 'menu:view-mode',
  EXPORT: 'export'
} as const
