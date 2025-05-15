
CREATE OR REPLACE FUNCTION get_latest_formula_weights(p_sport TEXT)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    jsonb_build_object(
      'id', id,
      'sport', sport,
      'weights', weights,
      'last_updated', last_updated,
      'sample_size', sample_size,
      'metric_changes', metric_changes
    ) INTO result
  FROM
    formula_weights
  WHERE
    sport = p_sport
  ORDER BY
    last_updated DESC
  LIMIT 1;
  
  RETURN result;
END;
$$;
