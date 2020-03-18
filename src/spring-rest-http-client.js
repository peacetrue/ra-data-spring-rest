import qs from 'qs';

function stringify(params) {
    return qs.stringify(params, {
        arrayFormat: 'repeat',
        serializeDate: (d) => d.getTime(),
        allowDots: true,
    });
}

export default (httpClient = fetch) => {
    return (url, options = {}) => {
        if (!options.headers) options.headers = new Headers();
        options.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        options.headers.set('Accept', 'application/json');
        // url params in options.params
        if (options.params) url += ('?' + stringify(options.params));
        // body params in options.body
        if (options.body) options.body = stringify(options.body);
        return httpClient(url, options);
    };
};
