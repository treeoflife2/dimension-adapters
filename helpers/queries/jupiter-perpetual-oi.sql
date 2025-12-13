WITH position_changes AS (
    -- IncreasePositionEvent (positive delta)
    SELECT
        date_trunc('day', block_time) AS day,
        'increase' as key,
        bytearray_to_bigint(bytearray_reverse(bytearray_substring(data,1+291,8))) / 1e6 AS size_usd_delta
    FROM solana.instruction_calls
    WHERE executing_account = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu'
    AND bytearray_substring(data,1+8,8) = 0xf5715534d6bb9984 -- IncreasePosition
    AND tx_success = true

    UNION ALL

    SELECT
        date_trunc('day', block_time) AS day,
        'instant-increase' as key,
        bytearray_to_bigint(bytearray_reverse(bytearray_substring(data,1+217,8))) / 1e6 AS size_usd_delta
    FROM solana.instruction_calls
    WHERE executing_account = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu'
    AND bytearray_substring(data,1+8,8) = 0xcdec3904d16a5745 -- InstantIncreasePosition
    AND tx_success = true

    UNION ALL

    -- DecreasePositionEvent (negative delta)
    SELECT
        date_trunc('day', block_time) AS day,
        'decrease' as key,
        -1*(bytearray_to_bigint(bytearray_reverse(bytearray_substring(data,1+292,8))) / 1e6) AS size_usd_delta
    FROM solana.instruction_calls
    WHERE executing_account = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu'
    AND bytearray_substring(data,1+8,8) = 0x409c2b4a6d83107f -- DecreasePosition
    AND tx_success = true

    UNION ALL

    -- InstantDecreasePositionEvent (negative delta)
    SELECT
        date_trunc('day', block_time) AS day,
        'instant-decrease' as key,
        -1*(bytearray_to_bigint(bytearray_reverse(bytearray_substring(data,1+258,8))) / 1e6) AS size_usd_delta
    FROM solana.instruction_calls
    WHERE executing_account = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu'
    AND bytearray_substring(data,1+8,8) = 0xabad6a19efbe3a3b -- InstantDecreasePosition
    AND tx_success = true

    UNION ALL

    -- LiquidatePositionEvent / LiquidateFullPositionEvent (negative delta)
    SELECT
        date_trunc('day', block_time) AS day,
        'liquidate' as key,
        -1*(bytearray_to_bigint(bytearray_reverse(bytearray_substring(data,1+177,8))) / 1e6) AS size_usd_delta
    FROM solana.instruction_calls
    WHERE executing_account = 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu'
    AND bytearray_substring(data,1+8,8) IN (0x68452084d423bf2f, 0x806547a880485654) -- LiquidatePosition, LiquidateFullPosition
    AND tx_success = true
),
-- Daily changes
daily_changes AS (
    SELECT
        day,
        SUM(size_usd_delta) AS daily_delta
    FROM position_changes
    GROUP BY day
),
-- Running sum (cumulative OI)
cumulative_oi AS (
    SELECT
        day,
        SUM(daily_delta) OVER (
            ORDER BY day 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS total_open_interest_usd
    FROM daily_changes
)
SELECT
    day,
    total_open_interest_usd
FROM cumulative_oi
ORDER BY day;
