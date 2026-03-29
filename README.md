# FrontendEcoflow

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Weather Price Statistics Endpoint

The frontend now integrates `POST /api/analysis/weather-price/statistics` via `WeatherPriceAnalysisService.computeStatistics()`.

### Supported request modes

1. **By existing run id**

```json
{ "analysis_run_id": 123 }
```

2. **By raw selection payload**

```json
{
  "start_date": "2026-03-01",
  "end_date": "2026-03-07",
  "bidding_zone_id": 10,
  "product_id": 77,
  "price_type": "spot",
  "cities": [{ "analysis_city_id": 1, "weight": 0.7 }]
}
```

### Expected response blocks

The response model supports these top-level keys:

- `meta`
- `descriptive_statistics`
- `correlations`
- `correlation_matrix`
- `bucket_analysis`
- `scatter_data`
- `lag_analysis`
- `interpretation_hints`
- optional: `outliers`
- optional: `trend_lines`

### Rendered visualizations

In the **Statistical Insights** section, the UI renders:

- KPI stats cards (mean/median/std/min/max)
- correlation widget
- correlation matrix table
- bucket analysis tables
- scatter plots with tooltip (`ts_utc`, `x`, `y`)
- lag analysis line chart for lags `0..3`
- interpretation hints list
- optional outlier and trend-line lists
