'use client';

import React from 'react';
import { DEFAULT_PRODUCT_TEMPLATES } from '../lib/default-data';
import { ProductTemplate } from '../lib/types';
import { ChevronDown, Shirt } from 'lucide-react';

interface ProductDropdownProps {
  selectedTemplateId: string;
  onSelectProduct: (template: ProductTemplate) => void;
  label?: string;
  templates?: ProductTemplate[];
}

export const ProductDropdown: React.FC<ProductDropdownProps> = ({
  selectedTemplateId,
  onSelectProduct,
  label = 'Modelo de Produto Base',
  templates = DEFAULT_PRODUCT_TEMPLATES,
}) => {
  const currentTemplate =
    templates.find((p) => p.id === selectedTemplateId) ||
    templates[0] ||
    DEFAULT_PRODUCT_TEMPLATES[0];

  // Agrupamento por categoria
  const categories = Array.from(new Set(templates.map((p) => p.category)));

  // Sincroniza automaticamente com o primeiro produto válido caso o ID atual não exista na lista
  React.useEffect(() => {
    if (templates.length > 0 && !templates.some((p) => p.id === selectedTemplateId)) {
      onSelectProduct(templates[0]);
    }
  }, [templates, selectedTemplateId, onSelectProduct]);

  const activeValue = templates.some((p) => p.id === selectedTemplateId)
    ? selectedTemplateId
    : (templates[0]?.id || selectedTemplateId);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-[var(--texto-secundario)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--nitro-primaria)]">
          <Shirt className="w-4 h-4" />
        </div>
        <select
          value={activeValue}
          onChange={(e) => {
            const found = templates.find((p) => p.id === e.target.value);
            if (found) onSelectProduct(found);
          }}
          className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-input)] hover:border-[var(--borda-hover)] text-[var(--texto-primario)] text-sm font-semibold rounded-xl border-2 border-[var(--borda-sutil)] focus:border-[var(--nitro-primaria)] focus:ring-2 focus:ring-[var(--nitro-primaria)]/20 outline-none transition-all duration-150 appearance-none cursor-pointer shadow-xs"
        >
          {categories.map((cat) => (
            <optgroup key={cat} label={`─── ${cat.toUpperCase()} ───`} className="bg-[var(--bg-superficie)] text-[var(--texto-secundario)] font-bold">
              {templates.filter((p) => p.category === cat).map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-[var(--bg-superficie)] text-[var(--texto-primario)] py-1">
                  {prod.name} ({prod.description})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--texto-secundario)]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
