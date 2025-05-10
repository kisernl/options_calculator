import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, CircleUser } from "lucide-react";

// Modal component (basic minimal version)
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow p-6 min-w-[320px] relative"
        style={{ maxWidth: 340 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-700"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// Helper: difference in days between today and expiration
function daysToExpiration(expiration: string) {
  if (!expiration) return 0;
  const today = new Date();
  const exp = new Date(expiration);
  const diff = Math.round(
    (exp.getTime() - today.getTime()) / (1000 * 3600 * 24)
  );
  return diff > 0 ? diff : 0;
}

function annualize(percentReturn: number, days: number) {
  if (days === 0) return 0;
  return percentReturn * (365 / days);
}

// Calculation logic for cash secured puts (unchanged)
function getResults({
  type,
  stockPrice,
  strikePrice,
  premium,
  expiration,
}: {
  type: "put" | "call";
  stockPrice: number;
  strikePrice: number;
  premium: number;
  expiration: string;
}) {
  const shares = 100;
  const days = daysToExpiration(expiration);
  let breakeven = 0;
  let capitalRequired = 0;
  let percentReturn = 0;
  let premiumPerDay = 0;
  let dropFromCurrent = 0;

  if (type === "put") {
    breakeven = strikePrice - premium;
    capitalRequired = strikePrice * shares;
    percentReturn = premium / strikePrice;
    dropFromCurrent = ((stockPrice - strikePrice) / stockPrice) * 100;
  } else {
    breakeven = strikePrice + premium;
    capitalRequired = stockPrice * shares;
    percentReturn = premium / stockPrice;
    dropFromCurrent = ((strikePrice - stockPrice) / stockPrice) * 100;
  }

  const premiumCollected = premium * shares;
  premiumPerDay = days > 0 ? premiumCollected / days : 0;
  const annualized = annualize(percentReturn, days) * 100;

  return {
    breakeven,
    capitalRequired,
    percentReturn: percentReturn * 100,
    premiumCollected,
    premiumPerDay,
    dropFromCurrent,
    days,
    annualized,
  };
}

// Covered Call calculation logic (corrected for premium % return and annualized)
const ccCalculate = ({
  stockPrice,
  shares,
  strike,
  premium,
  expiration,
  ownsShares,
  purchasePrice,
}: {
  stockPrice: number;
  shares: number;
  strike: number;
  premium: number;
  expiration: string;
  ownsShares: boolean;
  purchasePrice?: number;
}) => {
  if (!stockPrice || !shares || !strike || !premium || !expiration) return null;
  const options = Math.floor(shares / 100);
  const days = daysToExpiration(expiration);
  const entryCost = ownsShares && purchasePrice ? purchasePrice : stockPrice;
  const capitalUsed = shares * entryCost;
  const premiumCollected = options * 100 * premium;
  const breakeven = entryCost - premium;

  // --- CORRECTED premium return calcs: use only premiumCollected and capitalUsed ---
  const premiumPctReturn =
    capitalUsed > 0 ? (premiumCollected / capitalUsed) * 100 : 0;
  const premiumPerDay = days > 0 ? premiumCollected / days : 0;
  const annualized = days > 0 ? premiumPctReturn * (365 / days) : 0;

  // % Rise in Share Value now just for reference
  const pctRiseShare = ((strike - entryCost) / entryCost) * 100;
  const stockGainsIfEx = (strike - entryCost) * shares;
  const stockGainsPct = ((strike - entryCost) / entryCost) * 100;
  const totalGain = stockGainsIfEx + premiumCollected;
  const totalPctGain = capitalUsed > 0 ? (totalGain / capitalUsed) * 100 : 0;

  return {
    breakeven,
    options,
    pctRiseShare,
    premiumCollected,
    days,
    premiumPctReturn,
    premiumPerDay,
    capitalUsed,
    annualized,
    stockGainsIfEx,
    stockGainsPct,
    totalGain,
    totalPctGain,
  };
};

// Helper to highlight metric if above/below target
function MetricRow({
  label,
  value,
  target,
  actual,
  higherBetter,
}: {
  label: string;
  value: string | number;
  target?: number;
  actual?: number;
  higherBetter?: boolean;
}) {
  let meet = false;
  if (
    target !== undefined &&
    actual !== undefined &&
    target !== null &&
    actual !== null
  ) {
    meet = higherBetter ? actual >= target : actual <= target;
  }
  return (
    <div
      className={
        "flex justify-between " +
        (meet
          ? "bg-green-100 text-green-700 font-semibold rounded px-2 py-0.5"
          : "")
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Modal form for targets
function TargetsModal({
  open,
  onClose,
  targets,
  setTargets,
  fields,
  children,
}: {
  open: boolean;
  onClose: () => void;
  targets: Record<string, number>;
  setTargets: (t: Record<string, number>) => void;
  fields: { key: string; label: string }[];
  children?: React.ReactNode;
}) {
  const [local, setLocal] = useState(targets);
  React.useEffect(() => {
    setLocal(targets);
  }, [open, targets]);
  function handleSave() {
    setTargets(local);
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="mb-3 font-semibold text-zinc-700 max-w-xs"
        style={{ maxWidth: 340 }}
      >
        Set Trading Criteria
      </div>
      {children}
      <form
        className="flex flex-col gap-3 max-w-xs mt-3"
        style={{ maxWidth: 340 }}
      >
        {fields.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between gap-2 whitespace-nowrap"
          >
            <label className="text-zinc-700 text-sm" htmlFor={f.key}>
              {f.label}
            </label>
            <input
              id={f.key}
              type="number"
              className="px-2 py-1 border border-zinc-300 rounded text-right"
              style={{ width: 64, maxWidth: 72 }}
              placeholder="--"
              value={local[f.key] ?? ""}
              onChange={(e) => {
                const newLocal = { ...local };
                if (e.target.value === "") {
                  delete newLocal[f.key];
                } else {
                  newLocal[f.key] = Number(e.target.value);
                }
                setLocal(newLocal);
              }}
            />
          </div>
        ))}
      </form>
      <div
        className="flex gap-3 mt-6 justify-end max-w-xs"
        style={{ maxWidth: 340 }}
      >
        <button
          type="button"
          className="px-3 py-1.5 rounded border font-medium text-sm"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-zinc-700 text-white font-medium text-sm"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function ResultsCard({
  results,
  targets,
  onSetTargets,
}: {
  results: ReturnType<typeof getResults> | null;
  targets: Record<string, number>;
  onSetTargets: () => void;
}) {
  return (
    <Card className="max-w-lg p-6 bg-zinc-50 border border-zinc-200 relative mx-auto">
      <h2 className="font-medium text-zinc-700 mb-4 text-lg flex items-center justify-between">
        Results
        <button
          onClick={onSetTargets}
          className="text-zinc-400 hover:text-zinc-800 ml-2"
          aria-label="Set targets"
        >
          <SettingsIcon size={20} />
        </button>
      </h2>
      {!results ? (
        <div className="text-zinc-400">
          Enter required inputs to see calculations.
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-zinc-700">
          <MetricRow
            label="% Drop from Current Price"
            value={results.dropFromCurrent.toFixed(2) + "%"}
            target={targets.dropFromCurrent}
            actual={results.dropFromCurrent}
            higherBetter={true}
          />
          <MetricRow
            label="Breakeven Price"
            value={"$" + results.breakeven.toFixed(2)}
          />
          <MetricRow
            label="Premium collected ($)"
            value={"$" + results.premiumCollected.toFixed(2)}
          />
          <MetricRow label="Days to Expiration" value={String(results.days)} />
          <MetricRow
            label="% Return on Capital"
            value={results.percentReturn.toFixed(2) + "%"}
            target={targets.percentReturn}
            actual={results.percentReturn}
            higherBetter={true}
          />
          <MetricRow
            label="Premium per day ($)"
            value={"$" + results.premiumPerDay.toFixed(2)}
            target={targets.premiumPerDay}
            actual={results.premiumPerDay}
            higherBetter={true}
          />
          <MetricRow
            label="$ needed to Buy Stock"
            value={"$" + results.capitalRequired.toLocaleString()}
          />
          <MetricRow
            label="Premium Annualized"
            value={results.annualized.toFixed(2) + "%"}
            target={targets.annualized}
            actual={results.annualized}
            higherBetter={true}
          />
        </div>
      )}
    </Card>
  );
}

function CCResultsCard({
  results,
  targets,
  onSetTargets,
}: {
  results: ReturnType<typeof ccCalculate> | null;
  targets: Record<string, number>;
  onSetTargets: () => void;
}) {
  return (
    <Card className="max-w-lg p-6 bg-zinc-50 border border-zinc-200 relative mx-auto">
      <h2 className="font-medium text-zinc-700 mb-4 text-lg flex items-center justify-between">
        Results
        <button
          onClick={onSetTargets}
          className="text-zinc-400 hover:text-zinc-800 ml-2"
          aria-label="Set targets"
        >
          <SettingsIcon size={20} />
        </button>
      </h2>
      {!results ? (
        <div className="text-zinc-400">
          Enter required inputs to see calculations.
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-zinc-700">
          <MetricRow
            label="Breakeven Price"
            value={"$" + results.breakeven.toFixed(2)}
          />
          <MetricRow label="# Options to trade" value={results.options} />
          <MetricRow
            label="% Rise in Share Value"
            value={results.pctRiseShare.toFixed(2) + "%"}
          />
          <MetricRow
            label="Premium collected ($)"
            value={"$" + results.premiumCollected.toFixed(2)}
          />
          <MetricRow label="Days to Expiration" value={results.days} />
          <MetricRow
            label="Premium % Return @ Expiration"
            value={results.premiumPctReturn.toFixed(2) + "%"}
            target={targets.premiumPctReturn}
            actual={results.premiumPctReturn}
            higherBetter={true}
          />
          <MetricRow
            label="Premium per day ($)"
            value={"$" + results.premiumPerDay.toFixed(2)}
            target={targets.premiumPerDay}
            actual={results.premiumPerDay}
            higherBetter={true}
          />
          <MetricRow
            label="Capital used"
            value={"$" + results.capitalUsed.toLocaleString()}
          />
          <MetricRow
            label="Premium annualized"
            value={results.annualized.toFixed(2) + "%"}
            target={targets.annualized}
            actual={results.annualized}
            higherBetter={true}
          />
          <hr className="my-2" />
          <MetricRow
            label="Stock Gains if Exercised ($)"
            value={"$" + results.stockGainsIfEx.toFixed(2)}
          />
          <MetricRow
            label="Stock Gains for Holding Period (%)"
            value={results.stockGainsPct.toFixed(2) + "%"}
          />
          <MetricRow
            label="Total %Gain (Option & Stock)"
            value={results.totalPctGain.toFixed(2) + "%"}
            target={targets.totalPctGain}
            actual={results.totalPctGain}
            higherBetter={true}
          />
          <MetricRow
            label="Total Gain (Option & Stock)"
            value={"$" + results.totalGain.toFixed(2)}
            target={targets.totalGain}
            actual={results.totalGain}
            higherBetter={true}
          />
        </div>
      )}
    </Card>
  );
}

const CSP_TARGET_FIELDS = [
  { key: "dropFromCurrent", label: "% Drop from Current Price (max)" },
  { key: "percentReturn", label: "% Return on Capital (min)" },
  { key: "premiumPerDay", label: "Premium per day ($, min)" },
  { key: "annualized", label: "Premium Annualized (min %)" },
];

const CC_TARGET_FIELDS = [
  { key: "premiumPctReturn", label: "Premium % Return @ Exp (min)" },
  { key: "premiumPerDay", label: "Premium per day ($, min)" },
  { key: "annualized", label: "Premium annualized (min %)" },
  { key: "totalPctGain", label: "Total %Gain (Option & Stock, min)" },
  { key: "totalGain", label: "Total Gain (Option & Stock, min $)" },
];

// Minimalist User Login Modal
function UserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return !open ? null : (
    <Modal open={open} onClose={onClose}>
      <div className="mb-3 font-semibold text-zinc-700">User Login</div>
      <form className="flex flex-col gap-3">
        <input
          className="px-2 py-1 border rounded text-base"
          type="text"
          placeholder="Username"
          autoFocus
        />
        <input
          className="px-2 py-1 border rounded text-base"
          type="password"
          placeholder="Password"
        />
        <button
          type="button"
          className="rounded bg-zinc-700 text-white px-4 py-1.5 mt-2"
        >
          Login
        </button>
      </form>
      {/* <div className="mt-4 text-xs text-zinc-400">
        (This is a placeholder UI.)
      </div> */}
    </Modal>
  );
}

// Description for Targets Modal
const targetModalDesc = (
  <div className="mb-2 text-zinc-600 text-sm">
    Set your personal trading criteria for these results. When a calculated
    value meets or exceeds your target, it will be highlighted in green. These
    thresholds help ensure your trades fit your risk/return plan.
  </div>
);

// Corner user icon
function UserIcon({
  showUser,
  setShowUser,
}: {
  showUser: boolean;
  setShowUser: (b: boolean) => void;
}) {
  return (
    <button
      className="absolute top-3 right-5 z-30 bg-white rounded-full shadow-sm hover:shadow transition border border-zinc-200 p-1 flex items-center justify-center"
      style={{ width: 34, height: 34 }}
      onClick={() => setShowUser(true)}
      aria-label="Open user login modal"
    >
      <CircleUser size={20} className="text-zinc-500" />
    </button>
  );
}

const TabCalculator = ({ type }: { type: "put" | "call" }) => {
  // User icon/modal state
  const [showUser, setShowUser] = useState(false);

  if (type === "put") {
    const MOCK_CURRENT_PRICE = 99.0; // This should be fetched via API based on symbol (see above)
    const MOCK_EXPIRATION_START = new Date();
    MOCK_EXPIRATION_START.setDate(MOCK_EXPIRATION_START.getDate() + 7);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null); // ADD THIS
    const [symbol, setSymbol] = useState("");
    const [premium, setPremium] = useState("");
    // const [expiration, setExpiration] = useState(
    //   MOCK_EXPIRATION_START.toISOString().slice(0, 10)
    // );
    const [expiration, setExpiration] = useState(() => {
      const start = new Date();
      start.setDate(start.getDate() + 7);
      return start.toISOString().slice(0, 10);
    });
    const [targets, setTargets] = useState<Record<string, number>>({});
    const [showTargets, setShowTargets] = useState(false);

    const [strike, setStrike] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    useEffect(() => {
      if (symbol) {
        const fetchCurrentPrice = async () => {
          setLoadingPrice(true);
          setError(null);
          try {
            const response = await fetch(
              `/api/quote/finnhub/?symbol=${symbol}`
            );
            if (!response.ok) {
              throw new Error(
                `Could not fetch current price: ${response.status}`
              );
            }
            const data = await response.json();
            setCurrentPrice(data.quote.c);
          } catch (error: any) {
            setError(error.message);
            setCurrentPrice(null);
          } finally {
            setLoadingPrice(false);
          }
        };

        fetchCurrentPrice();
      } else {
        setCurrentPrice(null);
      }
    }, [symbol]);

    useEffect(() => {
      if (currentPrice !== null && !strike) {
        setStrike(Math.floor(currentPrice).toString());
      }
    }, [currentPrice, strike]);

    const stockPrice = MOCK_CURRENT_PRICE;
    let results = null;
    const ready = !!symbol && !!premium && !!strike && !!expiration;
    if (ready) {
      results = getResults({
        type,
        stockPrice: currentPrice!,
        strikePrice: parseFloat(strike),
        premium: parseFloat(premium),
        expiration,
      });
    }

    // Calendar-select for expiration (like covered call)
    return (
      <div className="flex flex-col md:flex-row gap-6 items-stretch w-full">
        <UserIcon showUser={showUser} setShowUser={setShowUser} />
        <Card className="w-full max-w-lg mx-auto p-6 flex flex-col gap-6 bg-white border border-zinc-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`symbol-put`}>Stock Symbol</Label>
              <Input
                id={`symbol-put`}
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
              <div className="text-sm text-zinc-600/90 mt-1">
                <strong>Current Price:</strong>{" "}
                {loadingPrice ? (
                  <span className="font-mono text-md">Loading...</span>
                ) : error ? (
                  <span className="font-mono text-red-500">Error: {error}</span>
                ) : currentPrice !== null ? (
                  <span className="font-mono  text-md">
                    ${currentPrice.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-mono  text-md">-</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`premium-put`}>Desired Premium ($)</Label>
              <Input
                id={`premium-put`}
                placeholder="e.g. 1.25"
                type="number"
                step="0.01"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`strike-put`}>Strike Price ($)</Label>
              <Input
                id={`strike-put`}
                type="number"
                value={strike}
                min={1}
                step={1}
                onChange={(e) => setStrike(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`expiration-put`}>Expiration Date</Label>
              <Input
                id={`expiration-put`}
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        </Card>
        <div className="relative w-full max-w-lg mx-auto">
          <ResultsCard
            results={results}
            targets={targets}
            onSetTargets={() => setShowTargets(true)}
          />
          <TargetsModal
            open={showTargets}
            onClose={() => setShowTargets(false)}
            targets={targets}
            setTargets={setTargets}
            fields={CSP_TARGET_FIELDS}
          >
            {targetModalDesc}
          </TargetsModal>
          <UserModal open={showUser} onClose={() => setShowUser(false)} />
        </div>
      </div>
    );
  }

  if (type === "call") {
    // --- API SUPPORT PLACEHOLDER for CALLS ---
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [symbol, setSymbol] = useState("");
    // Strike defaults to nearest int above current price, only initially
    const [strike, setStrike] = useState("");

    const [shares, setShares] = useState("100");

    const [premium, setPremium] = useState("");
    // Expiration starts a week from now, default
    const initialExp = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    })();
    const [expiration, setExpiration] = useState(initialExp);
    const [ownsShares, setOwnsShares] = useState(false);
    const [purchasePrice, setPurchasePrice] = useState("");
    const [targets, setTargets] = useState<Record<string, number>>({});
    const [showTargets, setShowTargets] = useState(false);
    const [showUser, setShowUser] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    useEffect(() => {
      if (symbol) {
        const fetchCurrentPrice = async () => {
          setLoadingPrice(true);
          setError(null);
          try {
            const response = await fetch(
              `/api/quote/finnhub/?symbol=${symbol}`
            );
            if (!response.ok) {
              throw new Error(
                `Could not fetch current price: ${response.status}`
              );
            }
            const data = await response.json();
            setCurrentPrice(data.quote.c);
          } catch (error: any) {
            setError(error.message);
            setCurrentPrice(null);
          } finally {
            setLoadingPrice(false);
          }
        };

        fetchCurrentPrice();
      } else {
        setCurrentPrice(null);
      }
    }, [symbol]);

    useEffect(() => {
      if (currentPrice !== null && !strike) {
        setStrike(Math.floor(currentPrice).toString());
      }
    }, [currentPrice, strike]);

    const ready =
      !!symbol &&
      !!shares &&
      !!strike &&
      !!premium &&
      !!expiration &&
      (!ownsShares || !!purchasePrice);
    const results = ready
      ? ccCalculate({
          stockPrice: currentPrice!, // this line is key: always supply current price, not user input
          shares: parseInt(shares, 10),
          strike: parseFloat(strike),
          premium: parseFloat(premium),
          expiration,
          ownsShares,
          purchasePrice: ownsShares ? parseFloat(purchasePrice) : undefined,
        })
      : null;

    return (
      <div className="flex flex-col md:flex-row gap-6 items-stretch w-full">
        <UserIcon showUser={showUser} setShowUser={setShowUser} />
        <Card className="w-full max-w-lg mx-auto p-6 flex flex-col gap-6 bg-white border border-zinc-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="symbol-call">Stock (Ticker Symbol)</Label>
              <Input
                id="symbol-call"
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                autoCapitalize="characters"
              />
              <div className="text-sm text-zinc-600/90 mt-1">
                <strong>Current Price:</strong>{" "}
                {loadingPrice ? (
                  <span className="font-mono text-md">Loading...</span>
                ) : error ? (
                  <span className="font-mono text-red-500">Error: {error}</span>
                ) : currentPrice !== null ? (
                  <span className="font-mono  text-md">
                    ${currentPrice.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-mono  text-md">-</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="shares"># of Shares</Label>
              <Input
                id="shares"
                type="number"
                placeholder="e.g. 100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min={100}
                inputMode="numeric"
                step={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ownsShares"
                type="checkbox"
                className="h-4 w-4 accent-zinc-600"
                checked={ownsShares}
                onChange={(e) => setOwnsShares(e.target.checked)}
              />
              <Label htmlFor="ownsShares">I already own the shares</Label>
            </div>
            {ownsShares && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="Enter your purchase price"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  min={0}
                  inputMode="decimal"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="strike-call">Options Strike Price</Label>
              <Input
                id="strike-call"
                type="number"
                placeholder="e.g. 105"
                value={strike}
                onChange={(e) => setStrike(e.target.value)}
                min={0}
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="premium-call">Option Premium ($)</Label>
              <Input
                id="premium-call"
                type="number"
                placeholder="e.g. 1.25"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                min={0}
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expiration-call">Expiration (date)</Label>
              <Input
                id="expiration-call"
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
          </div>
        </Card>
        <div className="relative w-full max-w-lg mx-auto">
          <CCResultsCard
            results={results}
            targets={targets}
            onSetTargets={() => setShowTargets(true)}
          />
          <TargetsModal
            open={showTargets}
            onClose={() => setShowTargets(false)}
            targets={targets}
            setTargets={setTargets}
            fields={CC_TARGET_FIELDS}
          >
            {targetModalDesc}
          </TargetsModal>
          <UserModal open={showUser} onClose={() => setShowUser(false)} />
        </div>
      </div>
    );
  }
  return null;
};

const App = () => {
  return (
    <main className="min-h-screen w-full bg-zinc-50 flex flex-col justify-center items-center px-2 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-700">
        Options Calculator
      </h1>
      <Tabs defaultValue="puts" className="w-full max-w-4xl">
        <TabsList className="mb-6 w-full bg-zinc-100 justify-center">
          <TabsTrigger value="puts">Cash Secured Puts</TabsTrigger>
          <TabsTrigger value="calls">Covered Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="puts" className="flex justify-center">
          <TabCalculator type="put" />
        </TabsContent>
        <TabsContent value="calls" className="flex justify-center">
          <TabCalculator type="call" />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default App;
