class Insight {
  public init = () => {
    if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      /* eslint-disable */
      const appInsights = require("applicationinsights");
      appInsights
        .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
        .start();
    }
  };
}

export const insight = new Insight();
