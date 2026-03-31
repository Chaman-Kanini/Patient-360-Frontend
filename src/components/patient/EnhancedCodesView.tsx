import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Check, X, Search, AlertCircle, Loader2, Layers } from 'lucide-react';
import { ragService, CodeSearchResult } from '../../services/ragService';
import { toast } from 'react-toastify';
import { getICD10Chapter, getCPTSection, ICD10Chapter, CPTSection } from '../../utils/medicalCodeClassification';

interface CodeCandidate {
  chunk_id?: string;
  code: string;
  short_description?: string;
  long_description?: string;
  description?: string;
  distance?: number;
}

interface ICD10CodeItem {
  diagnosis: string;
  icd10_code: string;
  description: string;
  confidence: number;
  candidates?: CodeCandidate[];
  isAISuggested?: boolean;
  isFinalized?: boolean;
}

interface CPTCodeItem {
  procedure: string;
  cpt_code: string;
  description: string;
  confidence: number;
  candidates?: CodeCandidate[];
  isAISuggested?: boolean;
  isFinalized?: boolean;
}

interface SelectedCode {
  id: string;
  type: 'icd10' | 'cpt';
  sourceItem: string;
  code: string;
  description: string;
  isAISuggested: boolean;
  isAccepted: boolean;
}

interface EnhancedCodesViewProps {
  rawData: any;
  batchId?: string;
  isLoading?: boolean;
  onFinalize?: (finalizedCodes: { icd10: SelectedCode[]; cpt: SelectedCode[] }) => Promise<void>;
}

interface SearchCodeModalProps {
  isOpen: boolean;
  type: 'icd10' | 'cpt';
  sourceItem: string;
  existingCodes: SelectedCode[];
  onClose: () => void;
  onAdd: (code: string, description: string) => void;
}

const SearchCodeModal: React.FC<SearchCodeModalProps> = ({ isOpen, type, sourceItem, existingCodes, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedResult, setSelectedResult] = useState<CodeSearchResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isICD = type === 'icd10';
  const accentColor = isICD ? 'blue' : 'green';

  const isCodeDuplicate = useCallback((code: string): boolean => {
    return existingCodes.some(c => c.type === type && c.code.toLowerCase() === code.toLowerCase() && c.isAccepted);
  }, [existingCodes, type]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(sourceItem || '');
      setResults([]);
      setHasSearched(false);
      setError('');
      setShowCustomForm(false);
      setCustomCode('');
      setCustomDescription('');
      setSelectedResult(null);
      setDuplicateWarning('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, sourceItem]);

  const handleSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError('');
    setResults([]);
    setHasSearched(false);
    setShowCustomForm(false);

    try {
      const response = await ragService.searchCodes(trimmed, type, 15);
      setResults(response.data || []);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'Failed to search codes. Please try again.');
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectResult = (result: CodeSearchResult) => {
    if (isCodeDuplicate(result.code)) {
      setDuplicateWarning(`Code ${result.code} already exists in the finalization list.`);
      setSelectedResult(null);
      return;
    }
    setDuplicateWarning('');
    setSelectedResult(result);
  };

  const handleConfirmAdd = () => {
    if (selectedResult) {
      onAdd(selectedResult.code, selectedResult.description);
      toast.success(`${isICD ? 'ICD-10' : 'CPT'} code ${selectedResult.code} added successfully`);
      onClose();
    }
  };

  const handleCancelConfirm = () => {
    setSelectedResult(null);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = customCode.trim();
    const trimmedDesc = customDescription.trim();
    if (trimmedCode && trimmedDesc) {
      if (isCodeDuplicate(trimmedCode)) {
        setDuplicateWarning(`Code ${trimmedCode} already exists in the finalization list.`);
        return;
      }
      onAdd(trimmedCode, trimmedDesc);
      toast.success(`${isICD ? 'ICD-10' : 'CPT'} code ${trimmedCode} added successfully`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 bg-${accentColor}-50 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {showCustomForm ? 'Add Custom' : 'Search'} {isICD ? 'ICD-10' : 'CPT'} Code
            </h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
          {sourceItem && (
            <p className="text-sm text-gray-600 mt-1">For: <span className="font-medium">{sourceItem}</span></p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!showCustomForm ? (
            <>
              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isICD ? 'Enter diagnosis description' : 'Enter procedure name'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
                      placeholder={isICD ? 'e.g., Type 2 diabetes mellitus' : 'e.g., Office visit established patient'}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className={`px-4 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      isICD
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`h-6 w-6 animate-spin text-${accentColor}-500 mr-2`} />
                  <span className="text-gray-600">Searching {isICD ? 'diagnoses' : 'procedures'}...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700">{duplicateWarning}</p>
                </div>
              )}

              {/* Confirmation Panel */}
              {selectedResult && (
                <div className={`mb-4 p-4 rounded-lg border-2 border-${accentColor}-300 bg-${accentColor}-50`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Confirm selection</p>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`font-mono font-bold text-${accentColor}-700 text-base whitespace-nowrap`}>
                      {selectedResult.code}
                    </span>
                    <p className="text-sm text-gray-800 leading-snug">{selectedResult.description}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelConfirm}
                      className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAdd}
                      className={`px-3 py-1.5 text-sm text-white rounded-lg font-medium flex items-center gap-1.5 ${
                        isICD ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirm & Add
                    </button>
                  </div>
                </div>
              )}

              {/* Results */}
              {hasSearched && !isSearching && results.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Found <span className="font-medium">{results.length}</span> matching codes — click to select:
                  </p>
                  <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                    {results.map((result, idx) => {
                      const isDuplicate = isCodeDuplicate(result.code);
                      return (
                        <button
                          key={`${result.code}_${idx}`}
                          onClick={() => !isDuplicate && handleSelectResult(result)}
                          disabled={isDuplicate}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            isDuplicate
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : selectedResult?.code === result.code
                                ? `bg-${accentColor}-50 border-${accentColor}-400`
                                : `hover:bg-${accentColor}-50 hover:border-${accentColor}-300 border-gray-200 bg-white`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`font-mono font-semibold text-sm whitespace-nowrap mt-0.5 ${
                              isDuplicate ? 'text-gray-400' : `text-${accentColor}-700`
                            }`}>
                              {result.code}
                            </span>
                            <p className={`text-sm leading-snug flex-1 ${isDuplicate ? 'text-gray-400' : 'text-gray-700'}`}>
                              {result.description}
                            </p>
                            {isDuplicate && (
                              <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                                Already added
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Results */}
              {hasSearched && !isSearching && results.length === 0 && !error && (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No matching codes found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    No {isICD ? 'ICD-10' : 'CPT'} codes matched your search.
                  </p>
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                      isICD
                        ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add a custom code
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Custom Code Form */
            <form onSubmit={handleCustomSubmit}>
              <p className="text-sm text-gray-500 mb-4">
                Manually enter a {isICD ? 'ICD-10' : 'CPT'} code and its description.
              </p>
              {duplicateWarning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700">{duplicateWarning}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => { setCustomCode(e.target.value); setDuplicateWarning(''); }}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}-500`}
                  placeholder={isICD ? 'e.g., E11.9' : 'e.g., 99213'}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${accentColor}-500`}
                  placeholder="Enter code description"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <Search className="h-3.5 w-3.5" />
                  Back to search
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg font-medium ${
                    isICD ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Add Code
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer — only show when not in custom form and results are visible */}
        {!showCustomForm && hasSearched && !isSearching && results.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={() => setShowCustomForm(true)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Can't find what you need? Add a custom code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Alternatives Modal ──────────────────────────────────────────────────────
interface AlternativesModalProps {
  isOpen: boolean;
  type: 'icd10' | 'cpt';
  sourceItem: string;
  primaryCode: string;
  candidates: CodeCandidate[];
  selectedCodes: SelectedCode[];
  onToggle: (type: 'icd10' | 'cpt', sourceItem: string, code: string, description: string) => void;
  onClose: () => void;
}

const AlternativesModal: React.FC<AlternativesModalProps> = ({
  isOpen, type, sourceItem, primaryCode, candidates, selectedCodes, onToggle, onClose
}) => {
  if (!isOpen) return null;
  const isICD = type === 'icd10';
  const accentColor = isICD ? 'blue' : 'green';

  const isSelected = (code: string) =>
    selectedCodes.some(c => c.type === type && c.sourceItem === sourceItem && c.code === code && c.isAccepted);

  const filtered = candidates
    .filter(c => c.code !== primaryCode)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 8);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className={`px-5 py-3.5 border-b border-gray-200 bg-${accentColor}-50 rounded-t-xl flex items-center justify-between`}>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Alternative Codes</h3>
            <p className="text-xs text-gray-600 mt-0.5 truncate">For: {sourceItem}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No alternative codes available.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((candidate, idx) => {
                const sel = isSelected(candidate.code);
                const desc = candidate.long_description || candidate.short_description || '';
                return (
                  <button
                    key={`${candidate.code}_${idx}`}
                    onClick={() => onToggle(type, sourceItem, candidate.code, desc)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                      sel
                        ? `bg-${accentColor}-50 border-${accentColor}-300`
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      sel ? `bg-${accentColor}-500 border-${accentColor}-500` : 'border-gray-300'
                    }`}>
                      {sel && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-mono font-semibold text-sm ${sel ? `text-${accentColor}-700` : 'text-gray-700'}`}>
                        {candidate.code}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">{desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
              isICD ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const EnhancedCodesView: React.FC<EnhancedCodesViewProps> = ({ 
  rawData, 
  batchId: _batchId,
  isLoading,
  onFinalize 
}) => {
  const [selectedCodes, setSelectedCodes] = useState<SelectedCode[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [addModalState, setAddModalState] = useState<{ isOpen: boolean; type: 'icd10' | 'cpt'; sourceItem: string }>({
    isOpen: false,
    type: 'icd10',
    sourceItem: ''
  });
  const [altModalState, setAltModalState] = useState<{
    isOpen: boolean; type: 'icd10' | 'cpt'; sourceItem: string; primaryCode: string; candidates: CodeCandidate[];
  }>({ isOpen: false, type: 'icd10', sourceItem: '', primaryCode: '', candidates: [] });
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const icd10Codes: ICD10CodeItem[] = rawData?.icd10_codes || [];
  const cptCodes: CPTCodeItem[] = rawData?.cpt_codes || [];

  // Initialize selected codes with AI suggestions (accepted by default)
  useEffect(() => {
    const initialCodes: SelectedCode[] = [];

    icd10Codes.forEach((item) => {
      const id = `icd10_${item.diagnosis}_${item.icd10_code}`;
      initialCodes.push({
        id,
        type: 'icd10',
        sourceItem: item.diagnosis,
        code: item.icd10_code,
        description: item.description,
        isAISuggested: item.isAISuggested !== false, // Default to true unless explicitly false
        isAccepted: true
      });
    });

    cptCodes.forEach((item) => {
      const id = `cpt_${item.procedure}_${item.cpt_code}`;
      initialCodes.push({
        id,
        type: 'cpt',
        sourceItem: item.procedure,
        code: item.cpt_code,
        description: item.description,
        isAISuggested: item.isAISuggested !== false, // Default to true unless explicitly false
        isAccepted: true
      });
    });

    setSelectedCodes(initialCodes);
  }, [rawData]);

  const handleToggleCandidate = (
    type: 'icd10' | 'cpt',
    sourceItem: string,
    candidateCode: string,
    candidateDescription: string
  ) => {
    const id = `${type}_${sourceItem}_${candidateCode}`;
    const exists = selectedCodes.find(c => c.id === id);

    if (exists) {
      // Remove if already selected
      setSelectedCodes(prev => prev.filter(c => c.id !== id));
    } else {
      // Add new selection
      setSelectedCodes(prev => [...prev, {
        id,
        type,
        sourceItem,
        code: candidateCode,
        description: candidateDescription,
        isAISuggested: false,
        isAccepted: true
      }]);
    }
  };

  const handleAddNewCode = (code: string, description: string) => {
    const { type, sourceItem } = addModalState;
    // For standalone codes (no sourceItem), use description as the sourceItem
    const effectiveSourceItem = sourceItem || description;
    const id = `${type}_${effectiveSourceItem}_${code}_custom`;
    
    // Check if already exists
    if (selectedCodes.find(c => c.id === id)) return;

    setSelectedCodes(prev => [...prev, {
      id,
      type,
      sourceItem: effectiveSourceItem,
      code,
      description,
      isAISuggested: false,
      isAccepted: true
    }]);
  };

  const handleRemoveFromFinal = (id: string) => {
    const codeEntry = selectedCodes.find(c => c.id === id);
    setSelectedCodes(prev => {
      const code = prev.find(c => c.id === id);
      if (code?.isAISuggested) {
        // For AI suggested codes, just mark as not accepted
        return prev.map(c => c.id === id ? { ...c, isAccepted: false } : c);
      }
      // For manually added codes, remove entirely
      return prev.filter(c => c.id !== id);
    });
    if (codeEntry) {
      toast.info(`${codeEntry.type === 'icd10' ? 'ICD-10' : 'CPT'} code ${codeEntry.code} removed`);
    }
  };

  const handleFinalize = async () => {
    if (!onFinalize) return;
    
    setIsFinalizing(true);
    try {
      const acceptedCodes = selectedCodes.filter(c => c.isAccepted);
      const icd10Final = acceptedCodes.filter(c => c.type === 'icd10');
      const cptFinal = acceptedCodes.filter(c => c.type === 'cpt');
      
      await onFinalize({ icd10: icd10Final, cpt: cptFinal });
      
      setNotification({
        show: true,
        message: 'Codes finalized successfully!',
        type: 'success'
      });
      
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to finalize codes. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clinical codes...</p>
        </div>
      </div>
    );
  }

  const acceptedCodes = selectedCodes.filter(c => c.isAccepted);
  const acceptedIcd10 = acceptedCodes.filter(c => c.type === 'icd10');
  const acceptedCpt = acceptedCodes.filter(c => c.type === 'cpt');

  // Build a lookup: sourceItem → candidates from raw data
  const candidatesMap: Record<string, { type: 'icd10' | 'cpt'; primaryCode: string; candidates: CodeCandidate[] }> = {};
  icd10Codes.forEach(item => {
    candidatesMap[`icd10_${item.diagnosis}`] = {
      type: 'icd10', primaryCode: item.icd10_code, candidates: item.candidates || []
    };
  });
  cptCodes.forEach(item => {
    candidatesMap[`cpt_${item.procedure}`] = {
      type: 'cpt', primaryCode: item.cpt_code, candidates: item.candidates || []
    };
  });

  // ── Group ICD-10 codes by chapter ──
  const icd10ByChapter: Record<string, { chapter: ICD10Chapter; sourceGroups: Record<string, SelectedCode[]> }> = {};
  const icd10Uncategorized: SelectedCode[] = [];
  acceptedIcd10.forEach(code => {
    const chapter = getICD10Chapter(code.code);
    if (chapter) {
      if (!icd10ByChapter[chapter.id]) {
        icd10ByChapter[chapter.id] = { chapter, sourceGroups: {} };
      }
      const src = code.sourceItem || 'Uncategorized';
      if (!icd10ByChapter[chapter.id].sourceGroups[src]) {
        icd10ByChapter[chapter.id].sourceGroups[src] = [];
      }
      icd10ByChapter[chapter.id].sourceGroups[src].push(code);
    } else {
      icd10Uncategorized.push(code);
    }
  });

  // ── Group CPT codes by section ──
  const cptBySection: Record<string, { section: CPTSection; sourceGroups: Record<string, SelectedCode[]> }> = {};
  const cptUncategorized: SelectedCode[] = [];
  acceptedCpt.forEach(code => {
    const section = getCPTSection(code.code);
    if (section) {
      if (!cptBySection[section.id]) {
        cptBySection[section.id] = { section, sourceGroups: {} };
      }
      const src = code.sourceItem || 'Uncategorized';
      if (!cptBySection[section.id].sourceGroups[src]) {
        cptBySection[section.id].sourceGroups[src] = [];
      }
      cptBySection[section.id].sourceGroups[src].push(code);
    } else {
      cptUncategorized.push(code);
    }
  });

  // Helper: render a single code row — inline code + description
  const renderCodeRow = (code: SelectedCode, accentColor: string) => {
    const cKey = `${code.type}_${code.sourceItem}`;
    const hasCandidates = candidatesMap[cKey] && candidatesMap[cKey].candidates.filter(c => c.code !== candidatesMap[cKey].primaryCode).length > 0;
    return (
      <div
        key={code.id}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg border border-${accentColor}-200 bg-${accentColor}-50`}
      >
        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 ${
          code.isAccepted ? `bg-${accentColor}-500 border-${accentColor}-500` : 'border-gray-300'
        }`}>
          {code.isAccepted && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className={`font-mono font-bold text-${accentColor}-700 text-sm flex-shrink-0`}>{code.code}</span>
        <span className="text-sm text-gray-700 truncate flex-1" title={code.description}>{code.description}</span>
        {code.isAISuggested && hasCandidates && (
          <button
            onClick={() => setAltModalState({
              isOpen: true,
              type: code.type,
              sourceItem: code.sourceItem,
              primaryCode: candidatesMap[cKey].primaryCode,
              candidates: candidatesMap[cKey].candidates
            })}
            className={`p-1 text-${accentColor}-400 hover:text-${accentColor}-600 flex-shrink-0`}
            title="View alternative codes"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
        )}
        {code.isAISuggested ? (
          <span className={`px-1.5 py-0.5 text-xs font-medium bg-${accentColor}-100 text-${accentColor}-700 rounded flex-shrink-0`}>AI</span>
        ) : (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded flex-shrink-0">Human Added</span>
        )}
        <button
          onClick={() => handleRemoveFromFinal(code.id)}
          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // Helper: render source group (diagnosis/procedure → codes under it)
  const renderSourceGroup = (sourceName: string, codes: SelectedCode[], accentColor: string) => {
    const aiCodes = codes.filter(c => c.isAISuggested);
    const humanCodes = codes.filter(c => !c.isAISuggested);
    return (
      <div key={sourceName} className="ml-3 border-l-2 border-gray-200 pl-3">
        <p className="text-xs font-medium text-gray-500 mb-1 truncate" title={sourceName}>{sourceName}</p>
        <div className="space-y-1">
          {aiCodes.map(c => renderCodeRow(c, accentColor))}
          {humanCodes.map(c => renderCodeRow(c, accentColor))}
        </div>
      </div>
    );
  };

  // Helper: render ICD-10 chapter tree
  const renderICD10Tree = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-blue-500" />
          <span className="text-sm">ICD-10</span>
          <span className="text-xs text-gray-500">(Diagnoses)</span>
        </h4>
        <button
          onClick={() => setAddModalState({ isOpen: true, type: 'icd10', sourceItem: '' })}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New ICD-10
        </button>
      </div>
      <div className="space-y-3 border-l-2 border-blue-200 ml-2">
        {Object.keys(icd10ByChapter).length === 0 && icd10Uncategorized.length === 0 && (
          <p className="text-xs text-gray-400 italic ml-4 py-2">No ICD-10 codes selected yet. Use the button above to add codes.</p>
        )}
        {Object.values(icd10ByChapter).map(({ chapter, sourceGroups }) => {
          const chapterKey = `ch_icd_${chapter.id}`;
          const isChapterExpanded = expandedItems[chapterKey] !== false;
          const totalInChapter = Object.values(sourceGroups).reduce((sum, arr) => sum + arr.length, 0);
          return (
            <div key={chapter.id} className="ml-2">
              <button
                onClick={() => setExpandedItems(prev => ({ ...prev, [chapterKey]: !isChapterExpanded }))}
                className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-blue-50 rounded px-2 transition-colors"
              >
                {isChapterExpanded
                  ? <ChevronUp className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  : <ChevronDown className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                }
                <span className="text-xs font-mono text-blue-500 flex-shrink-0">Ch {chapter.id}</span>
                <span className="text-xs font-medium text-gray-700 truncate">{chapter.range} {chapter.title}</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-auto">
                  {totalInChapter}
                </span>
              </button>
              {isChapterExpanded && (
                <div className="mt-1 space-y-2 mb-2">
                  {Object.entries(sourceGroups).map(([src, codes]) =>
                    renderSourceGroup(src, codes, 'blue')
                  )}
                </div>
              )}
            </div>
          );
        })}
        {icd10Uncategorized.length > 0 && (
          <div className="ml-2 px-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Other / Unclassified</p>
            <div className="space-y-1 ml-3 border-l-2 border-gray-200 pl-3">
              {icd10Uncategorized.map(c => renderCodeRow(c, 'blue'))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Helper: render CPT section tree
  const renderCPTTree = () => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-green-500" />
          <span className="text-sm">CPT</span>
          <span className="text-xs text-gray-500">(Procedures)</span>
        </h4>
        <button
          onClick={() => setAddModalState({ isOpen: true, type: 'cpt', sourceItem: '' })}
          className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New CPT
        </button>
      </div>
      <div className="space-y-3 border-l-2 border-green-200 ml-2">
        {Object.keys(cptBySection).length === 0 && cptUncategorized.length === 0 && (
          <p className="text-xs text-gray-400 italic ml-4 py-2">No CPT codes selected yet. Use the button above to add codes.</p>
        )}
        {Object.values(cptBySection).map(({ section, sourceGroups }) => {
          const sectionKey = `sec_cpt_${section.id}`;
          const isSectionExpanded = expandedItems[sectionKey] !== false;
          const totalInSection = Object.values(sourceGroups).reduce((sum, arr) => sum + arr.length, 0);
          return (
            <div key={section.id} className="ml-2">
              <button
                onClick={() => setExpandedItems(prev => ({ ...prev, [sectionKey]: !isSectionExpanded }))}
                className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-green-50 rounded px-2 transition-colors"
              >
                {isSectionExpanded
                  ? <ChevronUp className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                  : <ChevronDown className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                }
                <span className="text-xs font-mono text-green-500 flex-shrink-0">{section.category}</span>
                <span className="text-xs font-medium text-gray-700 truncate">{section.range} — {section.title}</span>
                <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-auto">
                  {totalInSection}
                </span>
              </button>
              {isSectionExpanded && (
                <div className="mt-1 space-y-2 mb-2">
                  {Object.entries(sourceGroups).map(([src, codes]) =>
                    renderSourceGroup(src, codes, 'green')
                  )}
                </div>
              )}
            </div>
          );
        })}
        {cptUncategorized.length > 0 && (
          <div className="ml-2 px-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Other / Unclassified</p>
            <div className="space-y-1 ml-3 border-l-2 border-gray-200 pl-3">
              {cptUncategorized.map(c => renderCodeRow(c, 'green'))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* ── Summary Bar ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <span>ICD-10: <strong className="text-blue-700">{acceptedIcd10.length} selected</strong></span>
          <span className="text-gray-300">|</span>
          <span>CPT: <strong className="text-green-700">{acceptedCpt.length} selected</strong></span>
        </div>
        <button
          onClick={handleFinalize}
          disabled={isFinalizing || (acceptedIcd10.length === 0 && acceptedCpt.length === 0)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            isFinalizing || (acceptedIcd10.length === 0 && acceptedCpt.length === 0)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isFinalizing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Finalizing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Finalize Codes
            </>
          )}
        </button>
      </div>

      {/* ── Vertical Tree Panels ── */}
      <div className="space-y-4">
        {/* ICD-10 Panel — always shown so user can add codes even if none exist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {renderICD10Tree()}
        </div>

        {/* CPT Panel — always shown so user can add codes even if none exist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {renderCPTTree()}
        </div>
      </div>

      {/* Search & Add Code Modal */}
      <SearchCodeModal
        isOpen={addModalState.isOpen}
        type={addModalState.type}
        sourceItem={addModalState.sourceItem}
        existingCodes={selectedCodes}
        onClose={() => setAddModalState(prev => ({ ...prev, isOpen: false }))}
        onAdd={handleAddNewCode}
      />

      {/* Alternatives Modal */}
      <AlternativesModal
        isOpen={altModalState.isOpen}
        type={altModalState.type}
        sourceItem={altModalState.sourceItem}
        primaryCode={altModalState.primaryCode}
        candidates={altModalState.candidates}
        selectedCodes={selectedCodes}
        onToggle={handleToggleCandidate}
        onClose={() => setAltModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default EnhancedCodesView;
