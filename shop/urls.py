from django.conf.urls import include, url
from django.utils.translation import ugettext_lazy as _

from .views import ReserveRedirectView, ReserveView, ReservationView


urlpatterns = [
    url(_(r'^reserve/'), include([
        url(r'^$', ReserveRedirectView.as_view(), name='reserve'),
        url(r'^(?P<product_code>\w+)/$', ReserveView.as_view(), name='reserve'),
    ])),
    url(_(r'^reservation/'), include([
        url(r'^(?P<product_code>\w+)/$', ReservationView.as_view(), name='reservation'),
    ])),
]
