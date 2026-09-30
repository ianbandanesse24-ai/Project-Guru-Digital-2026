import React, { useState } from 'react';
import {
  X,
  Palette,
  Check,
  Layout,
  Type,
  Maximize2,
  Sliders,
  Sparkles,
  RotateCcw,
  Sidebar as SidebarIcon,
  Columns,
  PanelTop,
} from 'lucide-react';
import {
  AppThemeConfig,
  ThemeColorPreset,
  ThemeFontFamily,
  ThemeMenuPosition,
  ThemeDensity,
  ThemeRadius,
  ThemeContentWidth,
} from '../types';
import {
  THEME_PRESETS,
  COLOR_OPTIONS,
  FONT_OPTIONS,
  MENU_POSITION_OPTIONS,
  DENSITY_OPTIONS,
  RADIUS_OPTIONS,
  CONTENT_WIDTH_OPTIONS,
  DEFAULT_THEME_CONFIG,
  applyThemeToDOM,
} from '../lib/theme';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AppThemeConfig;
  onSaveConfig: (newConfig: AppThemeConfig) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [tempConfig, setTempConfig] = useState<AppThemeConfig>(() => ({ ...currentConfig }));

  // Keep tempConfig in sync if opened anew
  React.useEffect(() => {
    if (isOpen) {
      setTempConfig({ ...currentConfig });
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleApplyPreset = (config: AppThemeConfig) => {
    setTempConfig({ ...config });
    // Live preview
    applyThemeToDOM(config);
  };

  const handleUpdate = <K extends keyof AppThemeConfig>(key: K, value: AppThemeConfig[K]) => {
    const updated = { ...tempConfig, [key]: value };
    setTempConfig(updated);
    // Live preview
    applyThemeToDOM(updated);
  };

  const handleSave = () => {
    onSaveConfig(tempConfig);
    applyThemeToDOM(tempConfig);
    onClose();
  };

  const handleReset = () => {
    setTempConfig({ ...DEFAULT_THEME_CONFIG });
    applyThemeToDOM(DEFAULT_THEME_CONFIG);
  };

  const handleCancel = () => {
    // Revert DOM back to currentConfig
    applyThemeToDOM(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Pengaturan Tema & Tampilan Antarmuka
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">
                Sesuaikan skema warna, jenis font, posisi tata letak menu, dan kepadatan aplikasi.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        <div className="px-5 pt-3.5 pb-2 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
                activeTab === 'presets'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilihan Tema Siap Pakai</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
                activeTab === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Kustomisasi Detail (Warna, Font, Menu)</span>
            </button>
          </div>

          <button
            onClick={handleReset}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            title="Kembalikan ke tema awal"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Standar</span>
          </button>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-900">
                Pilih Konfigurasi Desain Siap Pakai:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected =
                    tempConfig.preset === preset.config.preset &&
                    tempConfig.font === preset.config.font &&
                    tempConfig.menuPosition === preset.config.menuPosition &&
                    tempConfig.density === preset.config.density;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.config)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all duration-150 relative group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Top row: Title + color palette preview dots */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{preset.name}</span>
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-blue-600 text-white">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      {/* Color dots & details */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        {/* 4 Palette Dot Swatches */}
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                            style={{ backgroundColor: preset.previewColors.bg }}
                            title="Latar Belakang"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                            style={{ backgroundColor: preset.previewColors.surface }}
                            title="Kartu / Panel"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                            style={{ backgroundColor: preset.previewColors.accent }}
                            title="Aksen Warna"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                            style={{ backgroundColor: preset.previewColors.text }}
                            title="Warna Teks"
                          />
                        </div>

                        {/* Metadata Tags */}
                        <div className="flex items-center gap-1 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {preset.config.font}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {preset.config.menuPosition === 'left'
                              ? 'Sidebar Kiri'
                              : preset.config.menuPosition === 'right'
                              ? 'Sidebar Kanan'
                              : 'Navigasi Atas'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM TUNING */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* 1. Warna & Tampilan */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Skema Warna & Nuansa Tampilan</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = tempConfig.preset === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleUpdate('preset', c.id)}
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs font-semibold ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: c.accent }}
                          />
                          <span className="text-xs text-slate-800">{c.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Tipografi / Font */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Tipografi & Gaya Font</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = tempConfig.font === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleUpdate('font', f.id)}
                        className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{f.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 mt-1 tracking-tight">
                          {f.preview}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          {f.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Peletakan Menu */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Layout className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Peletakan Menu & Tata Letak Antarmuka</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {MENU_POSITION_OPTIONS.map((pos) => {
                    const isSelected = tempConfig.menuPosition === pos.id;
                    return (
                      <button
                        key={pos.id}
                        onClick={() => handleUpdate('menuPosition', pos.id)}
                        className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {pos.id === 'left' && <SidebarIcon className="w-3.5 h-3.5 text-slate-600" />}
                            {pos.id === 'right' && <Columns className="w-3.5 h-3.5 text-slate-600" />}
                            {pos.id === 'top' && <PanelTop className="w-3.5 h-3.5 text-slate-600" />}
                            <span className="text-xs font-bold text-slate-900">{pos.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                          {pos.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Density, Radius, Width in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Density */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900">Kepadatan Ruang:</span>
                  <div className="space-y-1.5">
                    {DENSITY_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleUpdate('density', d.id)}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-all duration-150 flex items-center justify-between ${
                          tempConfig.density === d.id
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{d.label}</span>
                        {tempConfig.density === d.id && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900">Gaya Sudut Kotak:</span>
                  <div className="space-y-1.5">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleUpdate('radius', r.id)}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-all duration-150 flex items-center justify-between ${
                          tempConfig.radius === r.id
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{r.label}</span>
                        {tempConfig.radius === r.id && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Width */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900">Lebar Halaman Kerja:</span>
                  <div className="space-y-1.5">
                    {CONTENT_WIDTH_OPTIONS.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => handleUpdate('contentWidth', w.id)}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-all duration-150 flex items-center justify-between ${
                          tempConfig.contentWidth === w.id
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{w.label}</span>
                        {tempConfig.contentWidth === w.id && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Pratinjau Langsung (Live Specimen)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {tempConfig.preset} • {tempConfig.font} • {tempConfig.menuPosition}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">
                  Pratinjau Kartu Administrasi Kurikulum
                </div>
                <div className="text-[11px] text-slate-500">
                  Siswa aktif: 32 • Modul Deep Learning: Tersedia
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
                  Aktif
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs shadow-xs"
                >
                  Contoh Tombol
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-save-theme-config"
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium shadow-xs transition-all duration-150"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Terapkan Tema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
