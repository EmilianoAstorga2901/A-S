"use strict";

(function () {
  const PERSONALIZATION_STORAGE_KEY = "investment-discovery-engine.personalization";

  const appShell = document.querySelector(".app-shell");
  const screenSections = Array.from(document.querySelectorAll("[data-screen]"));
  const navButtons = Array.from(document.querySelectorAll("[data-screen-target]"));
  const shortcutButtons = Array.from(document.querySelectorAll("[data-nav-target]"));
  const actionButtons = Array.from(document.querySelectorAll("[data-demo-action]"));
  const exploreViews = Array.from(document.querySelectorAll("[data-explore-view]"));
  const exploreDetail = document.querySelector('[data-explore-view="detail"]');
  const exploreChart = document.querySelector('[data-explore-view="chart"]');
  const resetExploreButton = document.getElementById("reset-explore");
  const resetPersonalizationButtons = Array.from(
    document.querySelectorAll("[data-reset-personalization]")
  );
  const feedStack = document.querySelector("[data-feed-stack]");
  const deckStage = document.querySelector(".deck-stage");
  const cards = Array.from(document.querySelectorAll("[data-card]"));
  const emptyState = document.querySelector("[data-empty-state]");
  const toast = document.querySelector("[data-toast]");
  const savedCounterNodes = Array.from(document.querySelectorAll("[data-saved-count]"));
  const remainingCounterNodes = Array.from(document.querySelectorAll("[data-remaining-count]"));
  const discardedCounterNodes = Array.from(document.querySelectorAll("[data-discarded-count]"));
  const closeDetailButtons = Array.from(document.querySelectorAll("[data-close-detail]"));
  const detailPanels = Array.from(document.querySelectorAll("[data-detail-content]"));
  const detailSaveButtons = Array.from(document.querySelectorAll("[data-detail-save]"));
  const openChartButtons = Array.from(document.querySelectorAll("[data-open-chart]"));
  const closeChartButtons = Array.from(document.querySelectorAll("[data-close-chart]"));
  const chartPanels = Array.from(document.querySelectorAll("[data-chart-content]"));
  const chartRangeButtons = Array.from(document.querySelectorAll("[data-chart-range]"));
  const chartRangePanels = Array.from(document.querySelectorAll("[data-chart-range-panel]"));
  const riskPreferenceButtons = Array.from(document.querySelectorAll("[data-pref-risk]"));
  const sectorPreferenceButtons = Array.from(document.querySelectorAll("[data-pref-sector]"));
  const assetTypePreferenceButtons = Array.from(
    document.querySelectorAll("[data-pref-asset-type]")
  );
  const personalizationSummaryNodes = Array.from(
    document.querySelectorAll("[data-personalization-summary]")
  );
  const personalizationReasonNodes = Array.from(
    document.querySelectorAll("[data-personalized-reason]")
  );

  const swipeThreshold = 120;
  const swipeAnimationMs = 260;
  const sectorKeySet = new Set(
    sectorPreferenceButtons.map((button) => button.dataset.prefSector).filter(Boolean)
  );
  const assetTypeKeySet = new Set(
    assetTypePreferenceButtons.map((button) => button.dataset.prefAssetType).filter(Boolean)
  );
  const riskProfileLabels = {
    low: "bajo",
    medium: "medio",
    high: "alto",
  };
  const sectorLabels = {
    technology: "tecnologia",
    "broad-market": "mercado amplio",
    "consumer-defensive": "consumo defensivo",
    rates: "bonos largos",
    gold: "oro",
  };
  const assetTypeLabels = {
    any: "todos",
    equity: "acciones",
    etf: "ETF",
    bond: "bonos",
    gold: "oro",
  };

  let toastTimeoutId = null;
  let activeDetailCard = null;
  let activeChartSlug = null;
  let dragState = null;

  function setChartFocusMode(enabled) {
    document.body.classList.toggle("is-chart-focus", enabled);
  }

  function validScreen(screenName) {
    return screenSections.some((section) => section.dataset.screen === screenName);
  }

  function resolveScreen(screenName) {
    return validScreen(screenName) ? screenName : "home";
  }

  function showToast(message) {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");

    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }

    toastTimeoutId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 180);
    }, 1800);
  }

  function readCsv(value) {
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function createEmptyBehavior() {
    return {
      savedBySector: {},
      savedByAssetType: {},
      discardedBySector: {},
      discardedByAssetType: {},
      savedActions: 0,
      discardedActions: 0,
    };
  }

  function normalizeRiskProfile(value) {
    if (value === "low" || value === "high") {
      return value;
    }

    return "medium";
  }

  function normalizeAssetType(value) {
    if (assetTypeKeySet.has(value)) {
      return value;
    }

    return "any";
  }

  function normalizeSectorList(values) {
    return values.filter((value, index) => sectorKeySet.has(value) && values.indexOf(value) === index);
  }

  function cloneBehaviorMap(source) {
    if (!source || typeof source !== "object") {
      return {};
    }

    const output = {};

    Object.keys(source).forEach((key) => {
      const numericValue = Number(source[key]);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        output[key] = numericValue;
      }
    });

    return output;
  }

  function buildDefaultPersonalizationState() {
    return {
      riskProfile: normalizeRiskProfile(
        appShell ? appShell.dataset.defaultRiskProfile : "medium"
      ),
      preferredSectors: normalizeSectorList(
        readCsv(appShell ? appShell.dataset.defaultSectors : "")
      ),
      preferredAssetType: normalizeAssetType(
        appShell ? appShell.dataset.defaultAssetType : "any"
      ),
      behavior: createEmptyBehavior(),
    };
  }

  function loadPersonalizationState(defaultState) {
    if (!window.localStorage) {
      return defaultState;
    }

    const rawValue = window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY);

    if (!rawValue) {
      return defaultState;
    }

    try {
      const parsed = JSON.parse(rawValue);
      const behavior = parsed && parsed.behavior ? parsed.behavior : {};

      return {
        riskProfile: normalizeRiskProfile(parsed ? parsed.riskProfile : defaultState.riskProfile),
        preferredSectors: normalizeSectorList(
          Array.isArray(parsed ? parsed.preferredSectors : null)
            ? parsed.preferredSectors
            : defaultState.preferredSectors
        ),
        preferredAssetType: normalizeAssetType(
          parsed ? parsed.preferredAssetType : defaultState.preferredAssetType
        ),
        behavior: {
          savedBySector: cloneBehaviorMap(behavior.savedBySector),
          savedByAssetType: cloneBehaviorMap(behavior.savedByAssetType),
          discardedBySector: cloneBehaviorMap(behavior.discardedBySector),
          discardedByAssetType: cloneBehaviorMap(behavior.discardedByAssetType),
          savedActions: Number.isFinite(Number(behavior.savedActions))
            ? Number(behavior.savedActions)
            : 0,
          discardedActions: Number.isFinite(Number(behavior.discardedActions))
            ? Number(behavior.discardedActions)
            : 0,
        },
      };
    } catch (error) {
      return defaultState;
    }
  }

  function persistPersonalizationState() {
    if (!window.localStorage) {
      return;
    }

    window.localStorage.setItem(
      PERSONALIZATION_STORAGE_KEY,
      JSON.stringify(personalizationState)
    );
  }

  const personalizationDefaults = buildDefaultPersonalizationState();
  let personalizationState = loadPersonalizationState(personalizationDefaults);

  function getCardsByState(stateName) {
    return cards.filter((card) => card.dataset.state === stateName);
  }

  function getCardMeta(card) {
    return {
      slug: card.dataset.slug || "",
      baseScore: Number(card.dataset.baseScore || "0"),
      sector: card.dataset.sector || "",
      assetType: card.dataset.assetType || "",
      riskBand: card.dataset.riskBand || "medium",
    };
  }

  function riskPreferenceBoost(riskBand) {
    if (personalizationState.riskProfile === "low") {
      if (riskBand === "low") {
        return 10;
      }
      if (riskBand === "medium") {
        return 4;
      }
      return -12;
    }

    if (personalizationState.riskProfile === "high") {
      if (riskBand === "high") {
        return 8;
      }
      if (riskBand === "medium") {
        return 4;
      }
      return -4;
    }

    if (riskBand === "medium") {
      return 8;
    }
    if (riskBand === "low") {
      return 3;
    }
    return -2;
  }

  function behaviorBoost(meta) {
    const behavior = personalizationState.behavior;
    const savedSectorBoost = (behavior.savedBySector[meta.sector] || 0) * 6;
    const savedAssetTypeBoost = (behavior.savedByAssetType[meta.assetType] || 0) * 4;
    const discardedSectorPenalty = (behavior.discardedBySector[meta.sector] || 0) * 4;
    const discardedAssetTypePenalty = (behavior.discardedByAssetType[meta.assetType] || 0) * 3;

    return savedSectorBoost + savedAssetTypeBoost - discardedSectorPenalty - discardedAssetTypePenalty;
  }

  function preferenceBoost(meta) {
    let boost = 0;

    if (personalizationState.preferredSectors.indexOf(meta.sector) >= 0) {
      boost += 12;
    }

    if (
      personalizationState.preferredAssetType !== "any" &&
      personalizationState.preferredAssetType === meta.assetType
    ) {
      boost += 10;
    }

    return boost;
  }

  function getPersonalizedScore(card) {
    const meta = getCardMeta(card);

    return (
      meta.baseScore +
      riskPreferenceBoost(meta.riskBand) +
      preferenceBoost(meta) +
      behaviorBoost(meta)
    );
  }

  function getPendingCards() {
    return getCardsByState("pending")
      .slice()
      .sort((leftCard, rightCard) => {
        const scoreDifference = getPersonalizedScore(rightCard) - getPersonalizedScore(leftCard);

        if (Math.abs(scoreDifference) > 0.0001) {
          return scoreDifference;
        }

        return getCardMeta(rightCard).baseScore - getCardMeta(leftCard).baseScore;
      });
  }

  function getActiveCard() {
    return getPendingCards()[0] || null;
  }

  function updateCounters() {
    const remainingCount = getCardsByState("pending").length;
    const savedCount = getCardsByState("saved").length;
    const discardedCount = getCardsByState("discarded").length;

    remainingCounterNodes.forEach((node) => {
      node.textContent = String(remainingCount);
    });

    savedCounterNodes.forEach((node) => {
      node.textContent = String(savedCount);
    });

    discardedCounterNodes.forEach((node) => {
      node.textContent = String(discardedCount);
    });
  }

  function resetCardPresentation(card) {
    card.hidden = true;
    card.classList.remove(
      "is-active",
      "is-next",
      "is-third",
      "is-dragging",
      "drag-left",
      "drag-right",
      "swipe-left",
      "swipe-right"
    );
    card.style.transform = "";
    card.style.opacity = "";
  }

  function renderDeck() {
    const pendingCards = getPendingCards();
    const activeCard = pendingCards[0] || null;
    const nextCard = pendingCards[1] || null;
    const thirdCard = pendingCards[2] || null;

    cards.forEach((card) => {
      resetCardPresentation(card);

      if (card.dataset.state !== "pending") {
        return;
      }

      if (card === activeCard) {
        card.hidden = false;
        card.classList.add("is-active");
        return;
      }

      if (card === nextCard) {
        card.hidden = false;
        card.classList.add("is-next");
        return;
      }

      if (card === thirdCard) {
        card.hidden = false;
        card.classList.add("is-third");
      }
    });

    if (deckStage) {
      deckStage.classList.toggle("is-empty", pendingCards.length === 0);
    }

    if (emptyState) {
      emptyState.hidden = pendingCards.length > 0;
    }

    updateCounters();
  }

  function setExploreView(viewName) {
    if (!exploreViews.length) {
      return;
    }

    exploreViews.forEach((view) => {
      view.hidden = view.dataset.exploreView !== viewName;
    });

    if (viewName === "feed") {
      detailPanels.forEach((panel) => {
        panel.hidden = true;
      });
      chartPanels.forEach((panel) => {
        panel.hidden = true;
      });
      activeDetailCard = null;
      activeChartSlug = null;
    }

    if (viewName === "detail") {
      chartPanels.forEach((panel) => {
        panel.hidden = true;
      });
      activeChartSlug = null;
    }

    setChartFocusMode(viewName === "chart");
  }

  function setActiveScreen(screenName) {
    const targetScreen = resolveScreen(screenName);

    screenSections.forEach((section) => {
      section.hidden = section.dataset.screen !== targetScreen;
    });

    navButtons.forEach((button) => {
      const isActive = button.dataset.screenTarget === targetScreen;
      button.classList.toggle("nav-active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    if (targetScreen === "explore") {
      setExploreView("feed");
      renderDeck();
    } else {
      setChartFocusMode(false);
    }

    if (window.location.hash !== "#" + targetScreen) {
      window.history.replaceState(null, "", "#" + targetScreen);
    }
  }

  function incrementCounter(store, key) {
    if (!key) {
      return;
    }

    store[key] = (store[key] || 0) + 1;
  }

  function recordInteraction(card, actionName) {
    const meta = getCardMeta(card);
    const behavior = personalizationState.behavior;

    if (actionName === "save") {
      incrementCounter(behavior.savedBySector, meta.sector);
      incrementCounter(behavior.savedByAssetType, meta.assetType);
      behavior.savedActions += 1;
    } else if (actionName === "discard") {
      incrementCounter(behavior.discardedBySector, meta.sector);
      incrementCounter(behavior.discardedByAssetType, meta.assetType);
      behavior.discardedActions += 1;
    }

    persistPersonalizationState();
    updatePersonalizationUI();
    updatePersonalizedReasons();
  }

  function completeAction(card, actionName) {
    recordInteraction(card, actionName);
    card.dataset.state = actionName === "save" ? "saved" : "discarded";
    activeDetailCard = null;
    renderDeck();
  }

  function animateCardOut(card, actionName) {
    const directionClass = actionName === "save" ? "swipe-right" : "swipe-left";
    card.classList.remove("is-dragging", "drag-left", "drag-right");
    card.classList.add(directionClass);
    card.style.pointerEvents = "none";

    window.setTimeout(() => {
      card.style.pointerEvents = "";
      completeAction(card, actionName);
      showToast(actionName === "save" ? "Oportunidad guardada." : "Idea descartada.");
    }, swipeAnimationMs);
  }

  function processDeckAction(actionName, card) {
    const activeCard = getActiveCard();

    if (!card || card !== activeCard || card.dataset.state !== "pending") {
      return;
    }

    animateCardOut(card, actionName);
  }

  function openDetail(card) {
    if (!exploreDetail || !card || card.dataset.state !== "pending") {
      return;
    }

    const targetPanel = detailPanels.find((panel) => panel.dataset.detailContent === card.dataset.slug);

    if (!targetPanel) {
      return;
    }

    detailPanels.forEach((panel) => {
      panel.hidden = panel !== targetPanel;
    });

    activeDetailCard = card;
    activeChartSlug = null;
    setExploreView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setChartRange(rangeName, slug) {
    if (!rangeName || !slug) {
      return;
    }

    const targetPanel = chartPanels.find((panel) => panel.dataset.chartContent === slug);

    if (!targetPanel) {
      return;
    }

    targetPanel.dataset.activeRange = rangeName;
    activeChartSlug = slug;

    chartRangeButtons.forEach((button) => {
      const isActive = button.dataset.chartSlug === slug && button.dataset.chartRange === rangeName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    chartRangePanels.forEach((panel) => {
      const belongsToSlug = panel.dataset.chartRangePanel.indexOf(slug + "::") === 0;

      if (!belongsToSlug) {
        return;
      }

      panel.hidden = panel.dataset.chartRangePanel !== slug + "::" + rangeName;
    });
  }

  function openChart(slug) {
    if (!exploreChart || !slug) {
      return;
    }

    const targetPanel = chartPanels.find((panel) => panel.dataset.chartContent === slug);

    if (!targetPanel) {
      return;
    }

    chartPanels.forEach((panel) => {
      panel.hidden = panel !== targetPanel;
    });

    const initialRange = targetPanel.dataset.activeRange || targetPanel.dataset.defaultChartRange || "3m";
    setChartRange(initialRange, slug);
    setExploreView("chart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraggedCard(card) {
    if (!card) {
      return;
    }

    card.classList.remove("is-dragging", "drag-left", "drag-right");
    card.style.transform = "";
    card.style.opacity = "";
  }

  function onPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const rotation = deltaX * 0.05;
    dragState.deltaX = deltaX;
    dragState.card.style.transform = "translateX(" + deltaX + "px) rotate(" + rotation + "deg)";
    dragState.card.style.opacity = String(Math.max(0.7, 1 - Math.abs(deltaX) / 360));
    dragState.card.classList.toggle("drag-right", deltaX > 40);
    dragState.card.classList.toggle("drag-left", deltaX < -40);
  }

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const currentDrag = dragState;
    dragState = null;

    if (Math.abs(currentDrag.deltaX) >= swipeThreshold) {
      const actionName = currentDrag.deltaX > 0 ? "save" : "discard";
      animateCardOut(currentDrag.card, actionName);
      return;
    }

    resetDraggedCard(currentDrag.card);
  }

  function buildRiskReason(riskBand) {
    if (personalizationState.riskProfile === "low") {
      if (riskBand === "low") {
        return "su riesgo bajo encaja con tu perfil conservador";
      }
      if (riskBand === "medium") {
        return "su riesgo medio sigue dentro de un perfil prudente";
      }
      return "";
    }

    if (personalizationState.riskProfile === "high") {
      if (riskBand === "high") {
        return "su riesgo alto encaja con tu perfil agresivo";
      }
      if (riskBand === "medium") {
        return "su riesgo medio deja espacio para buscar mas upside";
      }
      return "";
    }

    if (riskBand === "medium") {
      return "su riesgo medio esta alineado con tu perfil balanceado";
    }
    if (riskBand === "low") {
      return "su riesgo bajo aporta estabilidad a un perfil balanceado";
    }
    return "";
  }

  function buildPersonalizedReason(card) {
    if (!card) {
      return "";
    }

    const meta = getCardMeta(card);
    const behavior = personalizationState.behavior;
    const reasons = [];

    if ((behavior.savedBySector[meta.sector] || 0) > 0) {
      reasons.push("venis guardando oportunidades de " + (sectorLabels[meta.sector] || meta.sector));
    } else if (personalizationState.preferredSectors.indexOf(meta.sector) >= 0) {
      reasons.push("priorizas el sector " + (sectorLabels[meta.sector] || meta.sector));
    }

    if ((behavior.savedByAssetType[meta.assetType] || 0) > 0) {
      reasons.push(
        "tu comportamiento reciente favorece " +
          (assetTypeLabels[meta.assetType] || meta.assetType).toLowerCase()
      );
    } else if (
      personalizationState.preferredAssetType !== "any" &&
      personalizationState.preferredAssetType === meta.assetType
    ) {
      reasons.push(
        "priorizas " +
          (assetTypeLabels[meta.assetType] || meta.assetType).toLowerCase() +
          " en tu configuracion"
      );
    }

    const riskReason = buildRiskReason(meta.riskBand);
    if (riskReason) {
      reasons.push(riskReason);
    }

    if (!reasons.length) {
      return "Tambien aparece porque su score tecnico sigue competitivo para tu perfil actual.";
    }

    if (reasons.length === 1) {
      return "Tambien aparece porque " + reasons[0] + ".";
    }

    return "Tambien aparece porque " + reasons[0] + " y porque " + reasons[1] + ".";
  }

  function updatePersonalizedReasons() {
    personalizationReasonNodes.forEach((node) => {
      const slug = node.dataset.personalizedReason;
      const card = cards.find((item) => item.dataset.slug === slug);
      const paragraph = node.querySelector("p");
      const message = buildPersonalizedReason(card);

      if (!paragraph || !message) {
        node.hidden = true;
        return;
      }

      paragraph.textContent = message;
      node.hidden = false;
    });
  }

  function updatePersonalizationSummary() {
    const sectorText =
      personalizationState.preferredSectors.length > 0
        ? personalizationState.preferredSectors
            .map((sector) => sectorLabels[sector] || sector)
            .join(", ")
        : "sin sesgo sectorial";
    const assetTypeText =
      personalizationState.preferredAssetType === "any"
        ? "sin filtro por activo"
        : assetTypeLabels[personalizationState.preferredAssetType] ||
          personalizationState.preferredAssetType;
    const summaryText =
      "Perfil " +
      (riskProfileLabels[personalizationState.riskProfile] || "medio") +
      " · " +
      sectorText +
      " · " +
      assetTypeText +
      " · Guardadas " +
      personalizationState.behavior.savedActions +
      " · Descartadas " +
      personalizationState.behavior.discardedActions;

    personalizationSummaryNodes.forEach((node) => {
      node.textContent = summaryText;
    });
  }

  function updatePersonalizationUI() {
    riskPreferenceButtons.forEach((button) => {
      const isActive = button.dataset.prefRisk === personalizationState.riskProfile;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    sectorPreferenceButtons.forEach((button) => {
      const isActive = personalizationState.preferredSectors.indexOf(button.dataset.prefSector) >= 0;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    assetTypePreferenceButtons.forEach((button) => {
      const isActive = button.dataset.prefAssetType === personalizationState.preferredAssetType;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updatePersonalizationSummary();
  }

  function applyPersonalization() {
    persistPersonalizationState();
    updatePersonalizationUI();
    updatePersonalizedReasons();
    renderDeck();
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveScreen(button.dataset.screenTarget);
    });
  });

  shortcutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.navTarget || "home";
      setActiveScreen(target);
    });
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showToast(button.dataset.demoAction + " disponible en la siguiente etapa.");
    });
  });

  riskPreferenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      personalizationState.riskProfile = normalizeRiskProfile(button.dataset.prefRisk);
      applyPersonalization();
    });
  });

  sectorPreferenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSector = button.dataset.prefSector;
      const currentSectors = personalizationState.preferredSectors.slice();
      const currentIndex = currentSectors.indexOf(targetSector);

      if (currentIndex >= 0) {
        currentSectors.splice(currentIndex, 1);
      } else {
        currentSectors.push(targetSector);
      }

      personalizationState.preferredSectors = normalizeSectorList(currentSectors);
      applyPersonalization();
    });
  });

  assetTypePreferenceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      personalizationState.preferredAssetType = normalizeAssetType(button.dataset.prefAssetType);
      applyPersonalization();
    });
  });

  resetPersonalizationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      personalizationState = buildDefaultPersonalizationState();
      applyPersonalization();
      showToast("Personalizacion reiniciada.");
    });
  });

  if (resetExploreButton) {
    resetExploreButton.addEventListener("click", () => {
      cards.forEach((card) => {
        card.dataset.state = "pending";
        resetCardPresentation(card);
      });

      setExploreView("feed");
      renderDeck();
      showToast("Deck reiniciado.");
    });
  }

  if (feedStack) {
    feedStack.addEventListener("click", (event) => {
      const button = event.target.closest("[data-card-action]");

      if (!button) {
        return;
      }

      const card = button.closest("[data-card]");
      const actionName = button.dataset.cardAction;

      if (actionName === "details") {
        openDetail(card);
        return;
      }

      if (actionName === "save" || actionName === "discard") {
        processDeckAction(actionName, card);
      }
    });

    feedStack.addEventListener("pointerdown", (event) => {
      const card = event.target.closest("[data-card].is-active");

      if (!card || event.target.closest("button")) {
        return;
      }

      dragState = {
        card: card,
        deltaX: 0,
        pointerId: event.pointerId,
        startX: event.clientX,
      };

      card.classList.add("is-dragging");
      card.setPointerCapture(event.pointerId);
    });

    feedStack.addEventListener("pointermove", onPointerMove);
    feedStack.addEventListener("pointerup", finishDrag);
    feedStack.addEventListener("pointercancel", finishDrag);
  }

  closeDetailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setExploreView("feed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  detailSaveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetCard = document.querySelector('[data-card][data-slug="' + button.dataset.detailSave + '"]');

      if (!targetCard || targetCard.dataset.state !== "pending") {
        return;
      }

      setExploreView("feed");
      completeAction(targetCard, "save");
      showToast("Oportunidad guardada.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  openChartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openChart(button.dataset.openChart);
    });
  });

  closeChartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!activeDetailCard) {
        setExploreView("feed");
      } else {
        setExploreView("detail");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  chartRangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setChartRange(button.dataset.chartRange, button.dataset.chartSlug);
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveScreen(window.location.hash.replace("#", ""));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (exploreChart && !exploreChart.hidden) {
      setExploreView(activeDetailCard ? "detail" : "feed");
      return;
    }

    if (exploreDetail && !exploreDetail.hidden) {
      setExploreView("feed");
    }
  });

  updatePersonalizationUI();
  updatePersonalizedReasons();
  renderDeck();
  setExploreView("feed");
  setActiveScreen(window.location.hash.replace("#", ""));
})();
