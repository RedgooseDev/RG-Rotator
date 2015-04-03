function log(o) {console.log(o);}

(function($){
   var linkList = [
      'demo1.html',
      'demo2.html'
   ];

   var options = '';
   var selected = null;
   var patt = null;
   for (var o in linkList)
   {
      patt = new RegExp(linkList[o]);
      selected = (patt.test(window.location.href)) ? ' selected' : '';
      options += '<option value="' + linkList[o] + '"' + selected + '>' + linkList[o] + '</option>';
   }

   $('#gotodemo').html(options).on('change', function(){
      window.location.href = $(this).children(':selected').val();
   });

})(jQuery);
