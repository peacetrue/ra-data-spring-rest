import {
    CREATE,
    DELETE,
    DELETE_MANY,
    GET_LIST,
    GET_MANY,
    GET_MANY_REFERENCE,
    GET_ONE,
    UPDATE,
    UPDATE_MANY
} from "react-admin";

function pageParams(params) {
    return {
        ...params.filter,
        page: params.pagination.page - 1,
        size: params.pagination.perPage,
        sort: `${params.sort.field},${params.sort.order}`
    };
}

function pageFormat(response) {
    return {
        data: response.json.content,
        total: parseInt(response.json.totalElements, 10)
    };
}

/**
 * Maps react-admin queries to a REST API implemented using Spring Rest
 *
 * @example
 * GET_LIST             => GET http://my.api.url/posts?keyword=&page=0&size=10&sort=id,asc
 * GET_ONE              => GET http://my.api.url/posts/123
 * GET_MANY             => GET http://my.api.url/posts?id=1234&id=5678
 * GET_MANY_REFERENCE   => GET http://my.api.url/comments?postId=&page=0&size=10&sort=id,asc
 * CREATE               => POST http://my.api.url/posts
 * UPDATE               => PUT http://my.api.url/posts/123
 * UPDATE_MANY          => multiple call UPDATE
 * DELETE               => DELETE http://my.api.url/posts/123
 * DELETE_MANY          => multiple call DELETE
 */
export default (apiUrl, httpClient = fetch) => {
    let dataProvider = (type, resource, params) => {
        let url = `${apiUrl}/${resource}`,
            options = {},
            format = response => ({data: response.json});
        switch (type) {
            case GET_LIST:
                options.method = 'GET';
                options.params = pageParams(params);
                format = pageFormat;
                break;
            case GET_ONE:
                options.method = 'GET';
                url += `/${params.id}`;
                break;
            case GET_MANY:
                options.method = 'GET';
                options.params = {id: params.ids};
                format = pageFormat;
                break;
            case GET_MANY_REFERENCE:
                options.method = 'GET';
                options.params = pageParams(params);
                options.params[params.target] = params.id;
                format = pageFormat;
                break;
            case CREATE:
                options.method = 'POST';
                options.body = params.data;
                break;
            case UPDATE:
                url += `/${params.id}`;
                options.method = 'PUT';
                options.body = params.data;
                break;
            case UPDATE_MANY:
                //multiple call UPDATE
                return Promise.all(params.ids.map(id => dataProvider(UPDATE, resource, {id, data: params.data})))
                    .then(response => ({data: response.map(item => item.data)}));
            case DELETE:
                url += `/${params.id}`;
                options.method = 'DELETE';
                break;
            case DELETE_MANY:
                //multiple call DELETE
                return Promise.all(params.ids.map(id => dataProvider(DELETE, resource, {id})))
                    .then(response => ({data: response.map(item => item.data)}));
            default:
                throw new Error(`unknown type [${type}]`);
        }
        return httpClient(url, options).then(format);
    };
    return dataProvider;
};
