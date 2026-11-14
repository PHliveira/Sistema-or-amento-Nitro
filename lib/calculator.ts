import {
  CalculatedItemCost,
  CalculatedQuoteTotals,
  Fabric,
  Quote,
  QuoteItem,
  SizeGrid,
} from './types';
import { DEFAULT_FABRICS } from './default-data';

export function calculateSizeQuantities(sizes: SizeGrid) {
  const standardQuantity =
    (sizes.pp || 0) +
    (sizes.p || 0) +
    (sizes.m || 0) +
    (sizes.g || 0) +
    (sizes.gg || 0) +
    (sizes.exg || 0) +
    (sizes.tam02 || 0) +
    (sizes.tam04 || 0) +
    (sizes.tam06 || 0) +
    (sizes.tam08 || 0) +
    (sizes.tam10 || 0) +
    (sizes.tam12 || 0) +
    (sizes.tam14 || 0) +
    (sizes.tam16 || 0);

  const specialQuantity = (sizes.g1 || 0) + (sizes.g2 || 0);
  const totalQuantity = standardQuantity + specialQuantity;

  return { standardQuantity, specialQuantity, totalQuantity };
}

export function calculateFabricCost(item: QuoteItem, fabrics: Fabric[] = DEFAULT_FABRICS): number {
  if (item.fabricCostOverride && item.fabricCostOverride > 0) {
    return item.fabricCostOverride;
  }

  const fabric = fabrics.find((f) => f.id === item.fabricId) || fabrics[0];
  if (!fabric || fabric.yieldPerUnit <= 0) return 0;

  // 1. Custo Tecido Principal (Corpo)
  const costPerPieceBase = fabric.pricePerUnit / fabric.yieldPerUnit;
  const fabricBodyCost = costPerPieceBase * (1 + (fabric.wasteMarginPct || 0) / 100);

  // 2. Custo de Punho / Ribana / Gola (se habilitado no tecido)
  let punhoCost = 0;
  if (fabric.hasPunho && fabric.punhoYieldPerUnit && fabric.punhoYieldPerUnit > 0 && fabric.punhoPricePerUnit) {
    const punhoBase = fabric.punhoPricePerUnit / fabric.punhoYieldPerUnit;
    punhoCost = punhoBase * (1 + (fabric.punhoWasteMarginPct || 0) / 100);
  }

  return Number((fabricBodyCost + punhoCost).toFixed(2));
}

export function calculatePrintingCosts(item: QuoteItem, totalQuantity: number) {
  const qty = totalQuantity > 0 ? totalQuantity : 1;
  const p = item.printing;

  // 1. Silk Screen
  let silkScreensTotalCost = 0;
  let silkLaborAndInkUnitCost = 0;
  let silkTotalCost = 0;

  if (p.silk.enabled) {
    let totalColors = 0;
    for (const pos of p.silk.positions) {
      totalColors += pos.colorsCount;
      silkLaborAndInkUnitCost +=
        pos.colorsCount * (p.silk.applicationLaborPerPass + pos.inkCostPerPiece);
    }
    silkScreensTotalCost = totalColors * p.silk.costPerScreen;
    // Custo total silk no lote = custo das matrizes/telas + custo variável de aplicação * peças
    silkTotalCost = silkScreensTotalCost + silkLaborAndInkUnitCost * qty;
  }
  const silkUnitCost = silkTotalCost / qty;

  // 2. DTF (Direct to Film)
  let dtfUnitCost = 0;
  let dtfTotalCost = 0;
  if (p.dtf.enabled) {
    for (const pos of p.dtf.positions) {
      const areaM2 = ((pos.widthCm * pos.heightCm) / 10000) * (1 + p.dtf.wasteBufferPct / 100);
      const filmCost = areaM2 * p.dtf.costPerSquareMeter;
      dtfUnitCost += filmCost + pos.pressLaborCost;
    }
    dtfTotalCost = dtfUnitCost * qty;
  }

  // 3. Sublimação
  let sublimationUnitCost = 0;
  let sublimationTotalCost = 0;
  if (p.sublimation.enabled) {
    const s = p.sublimation;
    let costPerMeter = 0;
    if (s.mode === 'total' || s.mode === 'impressao_e_prensagem') {
      costPerMeter = s.paperAndInkCostPerMeter + s.pressOrCalenderCostPerMeter;
    } else if (s.mode === 'apenas_impressao') {
      costPerMeter = s.paperAndInkCostPerMeter;
    } else if (s.mode === 'apenas_prensagem') {
      costPerMeter = s.pressOrCalenderCostPerMeter;
    }
    // Total de metros no lote / total de peças ou por peça
    const totalSublimationMeters = s.linearMeters * (s.linearMeters > 5 ? 1 : qty);
    sublimationTotalCost = totalSublimationMeters * costPerMeter;
    sublimationUnitCost = sublimationTotalCost / qty;
  }

  // 4. Filme de Recorte
  let vinylUnitCost = 0;
  let vinylTotalCost = 0;
  if (p.vinyl.enabled) {
    const v = p.vinyl;
    const areaM2 = (v.widthCm * v.heightCm) / 10000;
    const materialCost = areaM2 * v.vinylCostPerSqMeter;
    const weedingCost = v.weedingMinutes * v.operatorMinuteCost;
    vinylUnitCost = materialCost + weedingCost + v.pressCost;
    vinylTotalCost = vinylUnitCost * qty;
  }

  const printingTotalCost = silkTotalCost + dtfTotalCost + sublimationTotalCost + vinylTotalCost;
  const printingUnitCost = printingTotalCost / qty;

  return {
    silkTotalCost,
    silkUnitCost,
    dtfTotalCost,
    dtfUnitCost,
    sublimationTotalCost,
    sublimationUnitCost,
    vinylTotalCost,
    vinylUnitCost,
    printingTotalCost,
    printingUnitCost,
  };
}

export function calculateItemCost(
  item: QuoteItem,
  fabrics: Fabric[] = DEFAULT_FABRICS,
  defaultMarginPct: number = 35
): CalculatedItemCost {
  const { standardQuantity, specialQuantity, totalQuantity } = calculateSizeQuantities(item.sizes);
  const qty = totalQuantity > 0 ? totalQuantity : 1;

  // Custos base
  const fabricUnitCost = calculateFabricCost(item, fabrics);
  const fabric = fabrics.find((f) => f.id === item.fabricId) || fabrics[0];
  const bodyYield = fabric?.yieldPerUnit && fabric.yieldPerUnit > 0 ? fabric.yieldPerUnit : 1;
  const fabricBodyUnitCost = fabric
    ? Number(((fabric.pricePerUnit / bodyYield) * (1 + (fabric.wasteMarginPct || 0) / 100)).toFixed(2))
    : fabricUnitCost;

  let punhoUnitCost = 0;
  let punhoTotalPurchaseKg = 0;
  let punhoTotalPurchaseCost = 0;

  if (fabric?.hasPunho && fabric.punhoYieldPerUnit && fabric.punhoYieldPerUnit > 0 && fabric.punhoPricePerUnit) {
    punhoUnitCost = Number(
      ((fabric.punhoPricePerUnit / fabric.punhoYieldPerUnit) * (1 + (fabric.punhoWasteMarginPct || 0) / 100)).toFixed(2)
    );
    if (totalQuantity > 0) {
      punhoTotalPurchaseKg = Number(
        ((totalQuantity / fabric.punhoYieldPerUnit) * (1 + (fabric.punhoWasteMarginPct || 0) / 100)).toFixed(2)
      );
      punhoTotalPurchaseCost = Number((punhoTotalPurchaseKg * fabric.punhoPricePerUnit).toFixed(2));
    }
  }

  let fabricTotalPurchaseKg = 0;
  let fabricTotalPurchaseCost = 0;
  if (fabric && totalQuantity > 0) {
    fabricTotalPurchaseKg = Number(
      ((totalQuantity / bodyYield) * (1 + (fabric.wasteMarginPct || 0) / 100)).toFixed(2)
    );
    fabricTotalPurchaseCost = Number((fabricTotalPurchaseKg * fabric.pricePerUnit).toFixed(2));
  }

  const sewingUnitCost = item.sewingCost || 0;
  const suppliesUnitCost =
    (item.threadCost || 0) +
    (item.tagCost || 0) +
    (item.packagingCost || 0) +
    (item.zipperCost || 0) +
    (item.buttonCost || 0);

  const logisticsUnitCost = (item.workshopLogisticsCost || 0) + (item.clientShippingCost || 0);

  // Estamparia
  const printings = calculatePrintingCosts(item, totalQuantity);

  // Custo unitário padrão da peça
  const baseStandardUnit =
    fabricUnitCost + sewingUnitCost + suppliesUnitCost + logisticsUnitCost + printings.printingUnitCost;

  // Custo para tamanhos especiais (G1, G2 com sobrepreço proporcional de tecido e costura)
  const specialSurcharge = (item.specialSizeSurchargePct || 15) / 100;
  const fabricAndSewingExtra = (fabricUnitCost + sewingUnitCost) * specialSurcharge;
  const baseSpecialUnit = baseStandardUnit + fabricAndSewingExtra;

  // Custo total do lote
  const totalProductionCost =
    totalQuantity > 0
      ? standardQuantity * baseStandardUnit + specialQuantity * baseSpecialUnit
      : baseStandardUnit;

  const unitProductionCost = totalQuantity > 0 ? totalProductionCost / totalQuantity : baseStandardUnit;

  // Margem de lucro (Percentual desejado sobre custo total)
  const marginPct =
    item.itemProfitMarginPct !== undefined ? item.itemProfitMarginPct : defaultMarginPct;
  const marginMultiplier = 1 + marginPct / 100;

  const mockupDesignFee = Number(item.mockupDesignFee || 0);

  // Preço base do produto com a margem aplicada
  const baseSellingPrice = totalProductionCost * marginMultiplier;
  const totalSellingPrice = Number((baseSellingPrice + mockupDesignFee).toFixed(2));
  const unitSellingPrice = totalQuantity > 0 ? Number((totalSellingPrice / totalQuantity).toFixed(2)) : Number((baseStandardUnit * marginMultiplier).toFixed(2));
  const specialUnitSellingPrice = Number((baseSpecialUnit * marginMultiplier).toFixed(2));
  const totalProfit = Number((totalSellingPrice - totalProductionCost).toFixed(2));
  // Margem efetiva real sem arredondamento truncado para preservar exatidão decimal
  const effectiveMarginPct = totalProductionCost > 0 ? Number(((totalProfit / totalProductionCost) * 100).toFixed(4)) : marginPct;

  return {
    totalQuantity,
    standardQuantity,
    specialQuantity,
    fabricUnitCost,
    fabricBodyUnitCost,
    punhoUnitCost,
    fabricTotalPurchaseKg,
    punhoTotalPurchaseKg,
    fabricTotalPurchaseCost,
    punhoTotalPurchaseCost,
    sewingUnitCost,
    suppliesUnitCost,
    logisticsUnitCost,
    silkTotalCost: printings.silkTotalCost,
    silkUnitCost: printings.silkUnitCost,
    dtfTotalCost: printings.dtfTotalCost,
    dtfUnitCost: printings.dtfUnitCost,
    sublimationTotalCost: printings.sublimationTotalCost,
    sublimationUnitCost: printings.sublimationUnitCost,
    vinylTotalCost: printings.vinylTotalCost,
    vinylUnitCost: printings.vinylUnitCost,
    printingTotalCost: printings.printingTotalCost,
    printingUnitCost: printings.printingUnitCost,
    totalProductionCost: Number(totalProductionCost.toFixed(2)),
    unitProductionCost: Number(unitProductionCost.toFixed(2)),
    specialUnitProductionCost: Number(baseSpecialUnit.toFixed(2)),
    mockupDesignFee,
    totalSellingPrice,
    unitSellingPrice,
    specialUnitSellingPrice,
    totalProfit,
    effectiveMarginPct,
  };
}

export function calculateQuoteTotals(
  quote: Quote,
  fabrics: Fabric[] = DEFAULT_FABRICS
): CalculatedQuoteTotals {
  let totalQuantity = 0;
  let totalProductionCost = 0;
  let totalProductsSellingPrice = 0;
  let totalItemMockupFees = 0;
  const itemsCalculated: Record<string, CalculatedItemCost> = {};

  for (const item of quote.items) {
    const calc = calculateItemCost(item, fabrics, quote.overallProfitMarginPct);
    itemsCalculated[item.id] = calc;
    totalQuantity += calc.totalQuantity;
    totalProductionCost += calc.totalProductionCost;
    totalProductsSellingPrice += calc.totalSellingPrice;
    totalItemMockupFees += calc.mockupDesignFee;
  }

  // Taxa de criação de arte ou mockup geral do pedido
  const quoteArtFee = Number(quote.artCreationFee || 0);
  const artCreationCost = Number((quoteArtFee).toFixed(2));

  // Tratamento do frete
  const shipping = quote.shipping;
  let shippingCost = 0;
  if (shipping && shipping.type !== 'frete_gratis' && shipping.type !== 'retirada') {
    // Se FOB (por conta do cliente/a pagar no destino), não soma na fatura do orçamento
    shippingCost = shipping.fretePorConta === 'FOB' ? 0 : Number((shipping.price || 0).toFixed(2));
  }

  const totalSellingPrice = Number((totalProductsSellingPrice + artCreationCost + shippingCost).toFixed(2));
  const totalProfit = Number(((totalProductsSellingPrice + artCreationCost) - totalProductionCost).toFixed(2));
  const averageMarginPct =
    totalProductionCost > 0
      ? Number(((totalProfit / totalProductionCost) * 100).toFixed(4))
      : quote.overallProfitMarginPct;

  // Comissão do Vendedor na Proposta Comercial
  const sellerCommissionPct =
    quote.sellerCommissionPct !== undefined ? Number(quote.sellerCommissionPct) : 5.0;
  const commissionBase = totalProductsSellingPrice + artCreationCost;
  const sellerCommissionFee =
    quote.sellerCommissionFee !== undefined && quote.sellerCommissionFee > 0
      ? Number(Number(quote.sellerCommissionFee).toFixed(2))
      : Number(((commissionBase * sellerCommissionPct) / 100).toFixed(2));

  // Lucro Líquido Real após pagamento da comissão do vendedor
  const netProfitAfterCommission = Number((totalProfit - sellerCommissionFee).toFixed(2));
  const effectiveMarginAfterCommissionPct =
    totalProductionCost > 0
      ? Number(((netProfitAfterCommission / totalProductionCost) * 100).toFixed(4))
      : 0;

  return {
    totalQuantity,
    totalProductionCost: Number(totalProductionCost.toFixed(2)),
    totalProductsSellingPrice: Number(totalProductsSellingPrice.toFixed(2)),
    artCreationCost,
    shippingCost,
    totalSellingPrice,
    totalProfit,
    averageMarginPct,
    sellerCommissionPct,
    sellerCommissionFee,
    netProfitAfterCommission,
    effectiveMarginAfterCommissionPct,
    itemsCalculated,
  };
}
