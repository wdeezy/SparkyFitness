import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Syringe, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePeptideApi, type PeptideLevel } from '@/hooks/Peptides/usePeptides';
import { debug, error as logError } from '@/utils/logging';
import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Compact, read-only peptide summary for the diary landing page. Mirrors the
 * "current level" cards on the full Peptides page, and navigates there on click
 * so the user can view the full chart and log injections.
 */
const PeptideSummary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loggingLevel } = usePreferences();
  const { getCurrentLevels } = usePeptideApi();

  const [levels, setLevels] = useState<PeptideLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentLevels()
      .then((data) => {
        if (!cancelled) {
          setLevels(data);
        }
      })
      .catch((err) => {
        logError(
          loggingLevel,
          'Failed to load peptide levels for summary.',
          err
        );
        if (!cancelled) {
          setLevels([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getCurrentLevels, loggingLevel]);

  const activeLevels = levels.filter((l) => l.is_active);

  debug(loggingLevel, 'PeptideSummary component rendered.', {
    count: activeLevels.length,
  });

  const goToPeptides = () => navigate('/peptides');

  return (
    <Card
      className="cursor-pointer transition hover:ring-2 hover:ring-primary"
      onClick={goToPeptides}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            {t('peptides.summaryTitle', 'Peptides')}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', 'Loading...')}
          </p>
        ) : activeLevels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('peptides.summaryEmpty', 'No peptides tracked. Tap to add one.')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {activeLevels.map((l) => (
              <div key={l.peptide_id} className="min-w-[120px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" title={l.name}>
                    {l.name}
                  </span>
                  <Badge variant="secondary">~{l.half_life_hours}h</Badge>
                </div>
                <div className="text-xl font-semibold">
                  {l.currentLevel} {l.dose_unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  {l.percentOfLastDoseRemaining != null
                    ? t(
                        'peptides.percentRemaining',
                        '{{percent}}% of last dose',
                        { percent: l.percentOfLastDoseRemaining }
                      )
                    : t('peptides.noInjections', 'No injections logged')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PeptideSummary;
