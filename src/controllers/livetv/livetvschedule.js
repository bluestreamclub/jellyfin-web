import layoutManager from 'layoutManager';
import cardBuilder from 'cardBuilder';
import imageLoader from 'imageLoader';
import loading from 'loading';
import 'scripts/livetvcomponents';
import 'emby-button';
import 'emby-itemscontainer';

function enableScrollX() {
    return !layoutManager.desktop;
}

function renderRecordings(elem, recordings, cardOptions) {
    if (recordings.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }

    const recordingItems = elem.querySelector('.recordingItems');

    if (enableScrollX()) {
        recordingItems.classList.add('scrollX');

        if (layoutManager.tv) {
            recordingItems.classList.add('smoothScrollX');
        }

        recordingItems.classList.add('hiddenScrollX');
        recordingItems.classList.remove('vertical-wrap');
    } else {
        recordingItems.classList.remove('scrollX');
        recordingItems.classList.remove('smoothScrollX');
        recordingItems.classList.remove('hiddenScrollX');
        recordingItems.classList.add('vertical-wrap');
    }

    recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
        items: recordings,
        shape: enableScrollX() ? 'autooverflow' : 'auto',
        showTitle: true,
        showParentTitle: true,
        coverImage: true,
        cardLayout: false,
        centerText: true,
        allowBottomPadding: !enableScrollX(),
        preferThumb: 'auto'
    }, cardOptions || {}));
    imageLoader.lazyChildren(recordingItems);
}

function getBackdropShape() {
    return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
}

function renderActiveRecordings(context, promise) {
    promise.then(function (result) {
        renderRecordings(context.querySelector('#activeRecordings'), result.Items, {
            shape: enableScrollX() ? 'autooverflow' : 'auto',
            defaultShape: getBackdropShape(),
            showParentTitle: false,
            showParentTitleOrTitle: true,
            showTitle: false,
            showAirTime: true,
            showAirEndTime: true,
            showChannelName: true,
            coverImage: true,
            overlayText: false,
            overlayMoreButton: true
        });
    });
}

function renderTimers(context, timers, options) {
    LiveTvHelpers.getTimersHtml(timers, options).then(function (html) {
        const elem = context;

        if (html) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        elem.querySelector('.recordingItems').innerHTML = html;
        imageLoader.lazyChildren(elem);
    });
}

function renderUpcomingRecordings(context, promise) {
    promise.then(function (result) {
        renderTimers(context.querySelector('#upcomingRecordings'), result.Items);
        loading.hide();
    });
}

export default function (view, params, tabContent) {
    let activeRecordingsPromise;
    let upcomingRecordingsPromise;
    const self = this;
    tabContent.querySelector('#upcomingRecordings .recordingItems').addEventListener('timercancelled', function () {
        self.preRender();
        self.renderTab();
    });

    self.preRender = function () {
        activeRecordingsPromise = ApiClient.getLiveTvRecordings({
            UserId: Dashboard.getCurrentUserId(),
            IsInProgress: true,
            Fields: 'CanDelete,PrimaryImageAspectRatio,BasicSyncInfo',
            EnableTotalRecordCount: false,
            EnableImageTypes: 'Primary,Thumb,Backdrop'
        });
        upcomingRecordingsPromise = ApiClient.getLiveTvTimers({
            IsActive: false,
            IsScheduled: true
        });
    };

    self.renderTab = function () {
        loading.show();
        renderActiveRecordings(tabContent, activeRecordingsPromise);
        renderUpcomingRecordings(tabContent, upcomingRecordingsPromise);
    };
};
