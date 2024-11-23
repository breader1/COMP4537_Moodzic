window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    // url: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/swagger.json",
    url: "https://comp4537moodzicbackend-grcvccftg4bzdmcr.canadacentral-01.azurewebsites.net/swagger.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    withCredentials: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout",
    requestInterceptor: (request) => {
      // Automatically add the "Bearer " prefix to the token in Authorization header if it's missing
      if (
        request.headers.Authorization &&
        !request.headers.Authorization.startsWith("Bearer ")
      ) {
        request.headers.Authorization = `Bearer ${request.headers.Authorization}`;
      }
      return request;
    },
  });

  //</editor-fold>
};
