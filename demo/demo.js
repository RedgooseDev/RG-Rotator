function log(o) {console.log(o);}

(function($){
   var linkList = [
      { name: 'Basic', src: 'demo1_basic.html' }
      ,{ name: 'Free', src: 'demo2_free.html' }
      ,{ name: 'Circle', src: 'demo3_circle.html' }
   ];

   var options = '';
   var selected = null;
   var patt = null;
   for (var o in linkList)
   {
      patt = new RegExp(linkList[o].src);
      selected = (patt.test(window.location.href)) ? ' selected' : '';
      options += '<option value="' + linkList[o].src + '"' + selected + '>' + linkList[o].name + '</option>';
   }

   $('#gotodemo').html(options).on('change', function(){
      window.location.href = $(this).children(':selected').val();
   });

})(jQuery);
