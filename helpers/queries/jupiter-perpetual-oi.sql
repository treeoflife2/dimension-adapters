WITH params AS (
    SELECT
        TIMESTAMP '2025-01-01' AS start_ts,
        TIMESTAMP '2025-11-01' AS end_ts
),
combined_events AS (
    SELECT
        'increase_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        sizeUsdDelta,
        CAST(NULL AS uint256) AS liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_increasepositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

    UNION ALL

    SELECT
        'instant_increase_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        sizeUsdDelta,
        CAST(NULL AS uint256) AS liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_instantincreasepositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

    UNION ALL

    SELECT
        'decrease_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        sizeUsdDelta,
        CAST(NULL AS uint256) AS liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_decreasepositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

    UNION ALL

    SELECT
        'instant_decrease_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        sizeUsdDelta,
        CAST(NULL AS uint256) AS liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_instantdecreasepositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

    UNION ALL

    SELECT
        'liquidate_full_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        positionSizeUsd AS sizeUsdDelta,
        liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_liquidatefullpositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

    SELECT
        'liquidate_position' AS event_type,
        evt_block_time,
        evt_tx_id,
        owner,
        positionSide,
        positionMint,
        positionSizeUsd,
        feeUsd,
        positionSizeUsd AS sizeUsdDelta,
        feeUsd as liquidationFeeUsd,
        price
    FROM jupiter_solana.perpetuals_evt_liquidatefullpositionevent e
    CROSS JOIN params p
    WHERE e.evt_block_time > p.start_ts
      AND e.evt_block_time < p.end_ts

)
SELECT *
FROM combined_events
ORDER BY evt_block_time;
